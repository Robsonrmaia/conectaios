// supabase/functions/messaging/index.ts
// Deno + Hono. Trata CORS/OPTIONS e usa o JWT do usuário (Authorization) via anon key.
import { Hono } from "jsr:@hono/hono"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type Database = any // use o tipo gerado se já existir no projeto

const app = new Hono()

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*")
  c.header("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type")
  c.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  if (c.req.method === "OPTIONS") return c.text("", 204)
  await next()
})

function userClient(c: any) {
  const url = Deno.env.get("SUPABASE_URL")!
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!
  return createClient<Database>(url, anon, {
    global: { headers: { Authorization: c.req.header("Authorization") ?? "" } },
    auth: { persistSession: false }
  })
}

// POST /messaging/create-or-get  { peer_id }
app.post("/messaging/create-or-get", async (c) => {
  try {
    const supabase = userClient(c)
    const { peer_id } = await c.req.json()
    if (!peer_id) return c.json({ error: "peer_id is required" }, 400)

    // quem é o usuário autenticado?
    const { data: { user }, error: uerr } = await supabase.auth.getUser()
    if (uerr || !user) return c.json({ error: "unauthenticated" }, 401)
    const me = user.id

    // Verifica se já existe thread com os 2 participantes usando a função RPC
    const { data: existing, error: exErr } = await supabase
      .rpc('find_existing_one_to_one_thread', { user_a: me, user_b: peer_id })
    if (exErr) return c.json({ error: exErr.message }, 500)

    let thread_id: string | null = existing

    if (!thread_id) {
      const { data: created, error: ctErr } = await supabase
        .from("chat_threads")
        .insert({ created_by: me, is_group: false })
        .select("id")
        .single()
      if (ctErr) return c.json({ error: ctErr.message }, 500)

      thread_id = created.id
      const { error: partErr } = await supabase.from("chat_participants").insert([
        { thread_id, user_id: me },
        { thread_id, user_id: peer_id },
      ])
      if (partErr) return c.json({ error: partErr.message }, 500)
    }

    return c.json({ thread_id }, 200)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// GET /messaging/list-threads
app.get("/messaging/list-threads", async (c) => {
  const supabase = userClient(c)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ error: "unauthenticated" }, 401)

  const { data, error } = await supabase
    .from("chat_threads")
    .select(`
      id, created_at, updated_at, title, is_group,
      chat_participants!inner(user_id)
    `)
    .order("updated_at", { ascending: false })
  if (error) return c.json({ error: error.message }, 500)

  // Filtra threads onde o usuário é participante
  const mine = (data || []).filter((t: any) =>
    t.chat_participants?.some((p: any) => p.user_id === user.id)
  )

  return c.json(mine, 200)
})

// POST /messaging/send  { thread_id, text }
app.post("/messaging/send", async (c) => {
  const supabase = userClient(c)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ error: "unauthenticated" }, 401)

  const { thread_id, text } = await c.req.json()
  if (!thread_id || !text) return c.json({ error: "thread_id and text are required" }, 400)

  // Atualizar timestamp da thread
  const { error: updateErr } = await supabase
    .from("chat_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", thread_id)
  if (updateErr) console.error("Failed to update thread timestamp:", updateErr)

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ thread_id, sender_id: user.id, body: text })
    .select("id, created_at, body, sender_id")
    .single()
  if (error) return c.json({ error: error.message }, 500)

  return c.json(data, 200)
})

// POST /messaging/messages (compatibilidade com invoke)
app.post("/messaging/messages/:thread_id", async (c) => {
  const supabase = userClient(c)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ error: "unauthenticated" }, 401)

  const thread_id = c.req.param("thread_id")
  
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, created_at, body, sender_id")
    .eq("thread_id", thread_id)
    .order("created_at", { ascending: true })
  if (error) return c.json({ error: error.message }, 500)

  return c.json(data || [], 200)
})

Deno.serve(app.fetch)