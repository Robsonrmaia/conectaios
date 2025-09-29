import { supabase } from "@/integrations/supabase/client";

export type UserRef = { id: string; name: string; email: string; avatar_url?: string };
export type Thread = { 
  id: string; 
  type: "dm" | "group"; 
  last_message_at: string | null;
  title?: string;
  last_text?: string;
};
export type Message = { 
  id: string; 
  thread_id: string; 
  sender_id: string; 
  body: string; 
  created_at: string 
};

function sortPair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

/** Lista corretores elegíveis para iniciar conversa (exclui o usuário atual) */
export async function listContacts(query: string = ""): Promise<UserRef[]> {
  const auth = await supabase.auth.getUser();
  const me = auth.data.user?.id;
  if (!me) throw new Error("not_authenticated");

  let rq = supabase
    .from("profiles")
    .select("id, name, email, avatar_url")
    .neq("id", me)
    .limit(20);

  if (query?.trim()) {
    rq = rq.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await rq;
  if (error) throw error;
  return (data || []) as UserRef[];
}

/** Garante um único DM entre dois usuários. Cria se não existir. */
export async function getOrCreateDMThread(otherUserId: string): Promise<Thread> {
  const auth = await supabase.auth.getUser();
  const me = auth.data.user?.id;
  if (!me) throw new Error("not_authenticated");

  const [a, b] = sortPair(me!, otherUserId);

  // 1) Tenta localizar thread por par ordenado
  const { data: found, error: findErr } = await supabase
    .from("chat_threads")
    .select("id, is_group, last_message_at, title")
    .eq("is_group", false)
    .eq("a_user_id", a)
    .eq("b_user_id", b)
    .maybeSingle();

  if (findErr && findErr.code !== "PGRST116") throw findErr;

  if (found) {
    return {
      id: found.id,
      type: "dm",
      last_message_at: found.last_message_at,
      title: found.title
    };
  }

  // 2) Cria thread + participantes
  const { data: thread, error: insErr } = await supabase
    .from("chat_threads")
    .insert([{ 
      is_group: false, 
      a_user_id: a, 
      b_user_id: b, 
      created_by: me,
      last_message_at: new Date().toISOString()
    }])
    .select("id, is_group, last_message_at, title")
    .single();

  if (insErr) throw insErr;

  const { error: pErr } = await supabase.from("chat_participants").insert([
    { thread_id: thread.id, user_id: a },
    { thread_id: thread.id, user_id: b },
  ]);

  if (pErr && pErr.code !== "23505") throw pErr;

  return {
    id: thread.id,
    type: "dm",
    last_message_at: thread.last_message_at,
    title: thread.title
  };
}

/** Lista threads do usuário atual com preview */
export async function listMyThreads(): Promise<Thread[]> {
  const auth = await supabase.auth.getUser();
  const me = auth.data.user?.id;
  if (!me) throw new Error("not_authenticated");

  const { data, error } = await supabase
    .from("chat_threads_view")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  
  return (data || []).map((t: any) => ({
    id: t.id,
    type: t.type as "dm" | "group",
    last_message_at: t.last_message_at,
    title: t.title,
    last_text: t.last_text
  }));
}

/** Lista mensagens de uma thread */
export async function listMessages(threadId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, thread_id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Envia mensagem para uma thread */
export async function sendMessage(thread_id: string, body: string): Promise<Message> {
  const auth = await supabase.auth.getUser();
  const me = auth.data.user?.id;
  if (!me) throw new Error("not_authenticated");

  const { data, error } = await supabase
    .from("chat_messages")
    .insert([{ thread_id, sender_id: me, body }])
    .select("id, thread_id, sender_id, body, created_at")
    .single();

  if (error) throw error;

  // Atualizar last_message_at da thread
  await supabase
    .from("chat_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", thread_id);

  return data as Message;
}

/** Stream de mensagens (tempo-real) */
export function subscribeThread(thread_id: string, cb: (m: Message) => void) {
  const channel = supabase
    .channel(`chat:${thread_id}`)
    .on(
      "postgres_changes",
      { 
        event: "INSERT", 
        schema: "public", 
        table: "chat_messages", 
        filter: `thread_id=eq.${thread_id}` 
      },
      (payload) => {
        const msg = payload.new as any;
        cb({
          id: msg.id,
          thread_id: msg.thread_id,
          sender_id: msg.sender_id,
          body: msg.body || msg.content || "",
          created_at: msg.created_at
        });
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
