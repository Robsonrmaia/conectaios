import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supa = createClient(url, key)

    const auth = req.headers.get('Authorization') // "Bearer <jwt>"
    if (!auth) return new Response(JSON.stringify({ error: 'missing_jwt' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    const { data: { user }, error: uerr } = await supa.auth.getUser(auth.replace('Bearer ', ''))
    if (uerr || !user) return new Response(JSON.stringify({ error: 'invalid_user' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    const { other_user_id, title } = await req.json().catch(() => ({}))
    if (!other_user_id) return new Response(JSON.stringify({ error: 'other_user_id_required' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    if (other_user_id === user.id) return new Response(JSON.stringify({ error: 'self_not_allowed' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    // 1) já existe?
    const { data: existing, error: ferr } = await supa
      .rpc('find_existing_one_to_one_thread', { user_a: user.id, user_b: other_user_id })
    if (ferr) return new Response(JSON.stringify({ error: 'rpc_fail', details: ferr.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    let threadId = existing ?? null
    if (!threadId) {
      // 2) cria thread
      const { data: t, error: terr } = await supa
        .from('chat_threads')
        .insert({ title: title ?? null, is_group: false, created_by: user.id })
        .select('id').single()
      if (terr) return new Response(JSON.stringify({ error: 'thread_insert_fail', details: terr.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      threadId = t.id

      // 3) participantes (2)
      const { error: perr } = await supa.from('chat_participants').insert([
        { thread_id: threadId, user_id: user.id,  role: 'member' },
        { thread_id: threadId, user_id: other_user_id, role: 'member' }
      ])
      if (perr) return new Response(JSON.stringify({ error: 'participants_insert_fail', details: perr.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ thread_id: threadId }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'unhandled', details: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

Deno.serve(handler)