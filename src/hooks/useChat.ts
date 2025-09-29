// src/hooks/useChat.ts
import { useEffect, useState, useCallback } from "react";
import { listThreads, sendMessage, getMessages } from "@/features/messaging/api";
import { supabase } from "@/integrations/supabase/client";

export function useChat(threadId?: string) {
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshThreads = useCallback(async () => {
    setLoading(true);
    try {
      const t = await listThreads();
      setThreads(t);
    } finally { setLoading(false); }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!threadId) return;
    const m = await getMessages(threadId);
    setMessages(m);
  }, [threadId]);

  const send = useCallback(async (text: string) => {
    if (!threadId || !text?.trim()) return;
    const m = await sendMessage(threadId, text.trim());
    setMessages(prev => [...prev, m]);
  }, [threadId]);

  useEffect(() => { refreshThreads(); }, [refreshThreads]);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    refreshMessages();
    
    // Real-time subscription
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, refreshMessages]);

  return { threads, messages, loading, refreshThreads, refreshMessages, send };
}