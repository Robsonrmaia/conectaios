// src/hooks/useChat.ts
import { useEffect, useRef, useState } from "react";
import { sendMessage, subscribeToThread, ChatMessage } from "@/data/chat";
import { supabase } from "@/integrations/supabase/client";

export function useChat(threadId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const unsubRef = useRef<null | (()=>void)>(null);

  // carregar mensagens atuais uma vez
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (!error && active) setMessages((data ?? []) as ChatMessage[]);
    })();
    return () => { active = false; };
  }, [threadId]);

  // assinatura realtime sem duplicar
  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    unsubRef.current = subscribeToThread(threadId, (msg) => {
      setMessages((prev) => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [threadId]);

  async function send(body: string) {
    const text = (body ?? "").trim();
    if (!text) return;
    const m = await sendMessage(threadId, text);
    // otimista (evita "sumir" se o realtime demorar)
    setMessages((prev) => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
  }

  return { messages, send };
}
