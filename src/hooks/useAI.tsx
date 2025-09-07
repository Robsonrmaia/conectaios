import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AIResponse {
  response: string;
  context?: {
    propertiesCount: number;
    clientsCount: number;
    dealsCount: number;
    tasksCount: number;
    notesCount: number;
  };
}

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const sendMessage = async (message: string): Promise<string> => {
    if (!user) {
      toast.error('Você precisa estar logado para usar o assistente IA');
      return 'Erro: usuário não autenticado';
    }

    setLoading(true);
    
    try {
      console.log('Sending message to AI:', message);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message,
          userId: user.id
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('AI response received:', data);

      const aiResponse: AIResponse = data;
      
      // Show context info if available
      if (aiResponse.context) {
        const { propertiesCount, clientsCount, dealsCount, tasksCount, notesCount } = aiResponse.context;
        const total = propertiesCount + clientsCount + dealsCount + tasksCount + notesCount;
        
        if (total > 0) {
          console.log(`Contexto usado: ${total} registros (${propertiesCount} propriedades, ${clientsCount} clientes, ${dealsCount} negócios, ${tasksCount} tarefas, ${notesCount} notas)`);
        }
      }

      return aiResponse.response || 'Desculpe, não consegui processar sua solicitação.';

    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast.error('Erro ao comunicar com o assistente IA');
      return 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.';
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading
  };
};