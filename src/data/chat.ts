// src/data/chat.ts
import { supabase } from "@/integrations/supabase/client";

export type ChatThread = {
  id: string;
  title: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  attachments: any[] | null;
  created_at: string;
  updated_at: string;
};

export const ChatAPI = {
  async listThreads() {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error("Not authenticated");

    // threads onde sou participante
    const { data: parts, error: e1 } = await supabase
      .from("chat_participants")
      .select("thread_id")
      .is("left_at", null)
      .eq("user_id", uid);
    if (e1) throw e1;

    const threadIds = (parts ?? []).map(p => p.thread_id);
    if (threadIds.length === 0) return [];

    const { data, error } = await supabase
      .from("chat_threads")
      .select("*")
      .in("id", threadIds)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as ChatThread[];
  },

  async getOrCreateDM(otherUserId: string) {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .rpc("find_or_create_dm", { user_a: uid, user_b: otherUserId });
    if (error) throw error;
    return data as string; // thread id
  },

  async listMessages(threadId: string, limit = 50) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data as ChatMessage[];
  },

  async sendMessage(threadId: string, body: string) {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ thread_id: threadId, sender_id: uid, body })
      .select()
      .single();
    if (error) throw error;
    return data as ChatMessage;
  },

  async markSeen(threadId: string, messageId: string) {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    // upsert por unicidade (thread_id, message_id, user_id, status)
    await supabase.from("chat_receipts").insert({
      thread_id: threadId,
      message_id: messageId,
      user_id: uid,
      status: "seen",
    }).select().maybeSingle();
  },

  subscribe(threadId: string, onInsert: (m: ChatMessage)=>void) {
    // Realtime por linha
    const channel = supabase
      .channel(`chat_messages:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
        (payload) => onInsert(payload.new as ChatMessage)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }
};