import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { asChatMessageArray } from '@/utils/typeCompat';

interface Thread {
  id: string;
  title: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  edited_at: string;
  attachments: any[];
}

interface UseEnhancedChatReturn {
  threads: Thread[];
  messages: Message[];
  currentThread: Thread | null;
  loading: boolean;
  createThread: (title: string, isGroup?: boolean) => Promise<string>;
  sendMessage: (threadId: string, content: string, attachments?: any[]) => Promise<void>;
  loadMessages: (threadId: string) => Promise<void>;
  setCurrentThread: (thread: Thread | null) => void;
}

export function useEnhancedChatHook(): UseEnhancedChatReturn {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(false);

  const loadThreads = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createThread = useCallback(async (title: string, isGroup = false): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          title,
          is_group: isGroup,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add user as participant
      await supabase
        .from('chat_participants')
        .insert({
          thread_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

      await loadThreads();
      return data.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Erro ao criar conversa');
      throw error;
    }
  }, [user, loadThreads]);

  const sendMessage = useCallback(async (threadId: string, content: string, attachments: any[] = []) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          body: content,
          attachments
        });

      if (error) throw error;

      // Update thread timestamp
      await supabase
        .from('chat_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);

      await loadMessages(threadId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      throw error;
    }
  }, [user]);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(asChatMessageArray(data || []));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user, loadThreads]);

  return {
    threads,
    messages,
    currentThread,
    loading,
    createThread,
    sendMessage,
    loadMessages,
    setCurrentThread
  };
}

// Legacy export for compatibility
export const useEnhancedChat = useEnhancedChatHook;