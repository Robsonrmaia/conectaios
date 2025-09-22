// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    console.log('Chat create-or-get-thread request received');
    
    // 1) Autenticação
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("authorization") ?? "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.error('Authentication error:', userErr);
      return json({ error: "UNAUTHENTICATED" }, 401);
    }
    const me = user.id;
    console.log('Authenticated user:', me);

    // 2) Body parsing
    const body = await req.json().catch(() => ({}));
    const peer_user_id = String(body?.peer_user_id || "").trim();
    console.log('Request body:', JSON.stringify(body, null, 2));

    if (!peer_user_id || peer_user_id === me) {
      console.error('Invalid peer_user_id:', peer_user_id);
      return json({ error: "INVALID_PEER", detail: "peer_user_id obrigatório e diferente do próprio usuário" }, 400);
    }

    // 3) Verificar se já existe thread 1:1
    console.log('Searching for existing thread between users:', me, 'and', peer_user_id);
    
    const { data: candidates } = await supabase
      .from("chat_participants")
      .select("thread_id")
      .in("user_id", [me, peer_user_id]);

    // Agrupar por thread_id e ver se tem exatamente os 2 usuários
    const countByThread: Record<string, number> = {};
    for (const r of candidates ?? []) {
      countByThread[r.thread_id] = (countByThread[r.thread_id] ?? 0) + 1;
    }
    
    // Verificar se alguma thread tem exatamente 2 participantes (os nossos 2)
    for (const [threadId, count] of Object.entries(countByThread)) {
      if (count === 2) {
        // Verificar se essa thread tem exatamente 2 participantes total
        const { data: allParticipants } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("thread_id", threadId);
          
        if (allParticipants && allParticipants.length === 2) {
          console.log('Found existing thread:', threadId);
          return json({ thread_id: threadId, created: false });
        }
      }
    }

    // 4) Criar nova thread
    console.log('Creating new thread...');
    
    const { data: thread, error: thErr } = await supabase
      .from("chat_threads")
      .insert({ is_group: false, created_by: me })
      .select("id")
      .single();
      
    if (thErr) {
      console.error('Thread creation error:', thErr);
      return json({ error: "THREAD_CREATE_FAILED", detail: thErr.message }, 400);
    }

    console.log('Thread created:', thread.id, 'adding participants...');

    // 5) Adicionar participantes
    const participants = [
      { thread_id: thread.id, user_id: me, role: "admin" },
      { thread_id: thread.id, user_id: peer_user_id, role: "member" },
    ] as const;

    const { error: pErr } = await supabase
      .from("chat_participants")
      .insert(participants);
      
    if (pErr) {
      console.error('Participants insert error:', pErr);
      
      // Tentar limpar a thread criada se a inserção de participantes falhou
      try {
        await supabase.from("chat_threads").delete().eq("id", thread.id);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }
      
      return json({ error: "PARTICIPANTS_INSERT_FAILED", detail: pErr.message }, 400);
    }

    console.log('Thread created successfully:', thread.id);
    return json({ thread_id: thread.id, created: true });
    
  } catch (e) {
    console.error('Internal error:', e);
    return json({ error: "INTERNAL_ERROR", detail: String(e?.message ?? e) }, 500);
  }
});

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}