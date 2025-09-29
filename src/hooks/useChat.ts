// src/hooks/useChat.ts
import { useEffect, useState, useCallback } from "react";
import { ChatAPI, ChatThread, ChatMessage } from "@/data/chat";

export function useChat(threadId?: string) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshThreads = useCallback(async () => {
    setLoading(true);
    try {
      const t = await ChatAPI.listThreads();
      setThreads(t);
    } finally { setLoading(false); }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!threadId) return;
    const m = await ChatAPI.listMessages(threadId);
    setMessages(m);
  }, [threadId]);

  const send = useCallback(async (text: string) => {
    if (!threadId || !text?.trim()) return;
    const m = await ChatAPI.sendMessage(threadId, text.trim());
    setMessages(prev => [...prev, m]);
  }, [threadId]);

  useEffect(() => { refreshThreads(); }, [refreshThreads]);

  useEffect(() => {
    if (!threadId) return;
    refreshMessages();
    const off = ChatAPI.subscribe(threadId, (m) => setMessages(prev => [...prev, m]));
    return () => off();
  }, [threadId, refreshMessages]);

  return { threads, messages, loading, refreshThreads, refreshMessages, send };
}