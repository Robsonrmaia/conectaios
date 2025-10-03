import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useConectaAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastMessageTime = useRef<number>(0);
  const messageCount = useRef<number>(0);

  const sendMessage = async (text: string) => {
    // Rate limiting: 2s entre mensagens
    const now = Date.now();
    if (now - lastMessageTime.current < 2000) {
      toast.error('Aguarde um momento antes de enviar outra mensagem');
      return;
    }

    // Limite de 10 mensagens por sessão
    if (messageCount.current >= 10) {
      toast.error('Limite de mensagens atingido. Recarregue a página para continuar.');
      return;
    }

    lastMessageTime.current = now;
    messageCount.current += 1;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Pegar últimas 10 mensagens para contexto
      const recentMessages = [...messages, userMessage].slice(-10);
      
      const { data, error: functionError } = await supabase.functions.invoke('conecta-ai-chat', {
        body: {
          message: text,
          history: recentMessages.slice(0, -1) // Todas menos a última (que é a atual)
        }
      });

      if (functionError) throw functionError;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      const errorMessage = err.message || 'Erro ao processar mensagem';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Remover mensagem do usuário em caso de erro
      setMessages(prev => prev.slice(0, -1));
      messageCount.current -= 1;
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
}
