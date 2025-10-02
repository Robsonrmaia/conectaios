// src/data/chat.ts
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  attachments?: any[];
  reply_to_id?: string | null;
};

export async function findOrCreateDirectThread(userA: string, userB: string) {
  const { data, error } = await supabase.rpc("find_or_create_direct_thread", { user_a: userA, user_b: userB });
  if (error) throw error;
  return data as string;
}

export async function sendMessage(threadId: string, body: string, replyTo?: string) {
  const { data, error } = await supabase.rpc("send_message_new", { p_thread_id: threadId, p_body: body, p_reply_to: replyTo ?? null });
  if (error) throw error;
  return data as ChatMessage;
}

export function subscribeToThread(threadId: string, onInsert: (m: ChatMessage)=>void) {
  // canal único e estável por thread
  const channel = supabase.channel(`chat_thread_${threadId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
      (payload) => onInsert(payload.new as ChatMessage)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
