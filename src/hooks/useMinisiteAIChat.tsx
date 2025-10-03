import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useMinisiteAIChat(brokerId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastMessageTime = useRef<number>(0);
  const messageCount = useRef<number>(0);

  const sendMessage = useCallback(async (text: string) => {
    // Rate limiting: 2 segundos entre mensagens
    const now = Date.now();
    if (now - lastMessageTime.current < 2000) {
      toast({
        title: "Aguarde um momento",
        description: "Por favor, aguarde 2 segundos entre mensagens",
        variant: "destructive"
      });
      return;
    }

    // Limite de 10 mensagens por sessão
    if (messageCount.current >= 10) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de 10 mensagens. Recarregue a página para continuar.",
        variant: "destructive"
      });
      return;
    }

    lastMessageTime.current = now;
    messageCount.current += 1;

    // Adiciona mensagem do usuário
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      // Mantém apenas as últimas 10 mensagens no histórico
      const recentHistory = messages.slice(-10);

      const { data, error: functionError } = await supabase.functions.invoke('minisite-ai-chat', {
        body: {
          brokerId,
          message: text,
          history: recentHistory
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.response) {
        throw new Error('Resposta inválida da IA');
      }

      // Adiciona resposta da IA
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => {
        // Mantém apenas as últimas 10 mensagens
        const newMessages = [...prev, assistantMessage];
        return newMessages.slice(-10);
      });

    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      
      let errorMessage = 'Desculpe, ocorreu um erro. Tente novamente.';
      
      if (err.message?.includes('429')) {
        errorMessage = 'Muitas solicitações. Por favor, aguarde um momento.';
      } else if (err.message?.includes('402')) {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
      }

      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [brokerId, messages]);

  return {
    messages,
    loading,
    error,
    sendMessage
  };
}
