import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  reply_to_id?: string;
}

interface Thread {
  id: string;
  title?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  chat_participants: Array<{
    user_id: string;
    profiles: Array<{
      id: string;
      name: string;
      email: string;
      avatar_url?: string;
    }>;
  }>;
}

export function useMessaging() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string>();

  const loadThreads = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select(`
          id, title, is_group, created_at, updated_at,
          chat_participants!inner(
            user_id,
            profiles!inner(id, name, email, avatar_url)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    if (!threadId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startOneToOneThread = async (targetUserId: string): Promise<string> => {
    const { data: threadId, error } = await supabase.rpc('msg_create_or_get_direct', {
      target_user_id: targetUserId
    });
    
    if (error) throw new Error(error.message || 'Failed to create thread');
    return threadId as string;
  };

  const sendMessage = async (threadId: string, text: string): Promise<Message> => {
    const { data, error } = await supabase.rpc('msg_send_message', {
      thread_id: threadId,
      content: text
    });
    
    if (error) throw new Error(error.message || 'Failed to send message');
    return data as Message;
  };

  const searchUsers = async (query: string) => {
    if (!user?.id || !query.trim()) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .ilike('name', `%${query}%`)
      .neq('id', user.id)
      .order('name', { ascending: true })
      .limit(20);

    if (error) throw error;
    return data || [];
  };

  useEffect(() => {
    if (user?.id) {
      loadThreads();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeThreadId) {
      loadMessages(activeThreadId);
      
      // Real-time subscription for messages
      const channel = supabase
        .channel(`messages:${activeThreadId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `thread_id=eq.${activeThreadId}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeThreadId]);

  return {
    threads,
    messages,
    loading,
    activeThreadId,
    setActiveThreadId,
    loadThreads,
    startOneToOneThread,
    sendMessage,
    searchUsers
  };
}