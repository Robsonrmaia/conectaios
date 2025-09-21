import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  sender_name: string | null;
  is_read: boolean;
  created_at: string;
}

interface Thread {
  id: string;
  title?: string;
  participants: string[];
  last_message_at: string;
  created_at: string;
  type: string;
  deal_id?: string;
}

export function useRealTimeMessaging() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<{ [threadId: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .contains('participants', [user.id])
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch messages for a thread
  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(prev => ({
        ...prev,
        [threadId]: (data || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_name: msg.sender_name,
          user_id: msg.user_id,
          thread_id: msg.thread_id,
          created_at: msg.created_at,
          is_read: msg.is_read || false
        }))
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (threadId: string, content: string) => {
    if (!user?.id || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          content: content.trim(),
          sender_name: user.user_metadata?.name || user.email || 'Usuário',
          user_id: user.id
        });

      if (error) throw error;

      // Update thread's last_message_at
      await supabase
        .from('threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  }, [user?.id, user?.user_metadata?.name, user?.email]);

  // Create new thread
  const createThread = useCallback(async (participantIds: string[], title?: string, dealId?: string) => {
    if (!user?.id) return null;

    try {
      // Get broker ID for current user
      const { data: brokerData, error: brokerError } = await supabase
        .from('conectaios_brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (brokerError || !brokerData) {
        throw new Error('Broker não encontrado para o usuário');
      }

      const { data, error } = await supabase
        .from('threads')
        .insert({
          participants: [brokerData.id, ...participantIds.filter(id => id !== brokerData.id)],
          title: title || 'Nova Conversa',
          type: dealId ? 'deal' : 'general',
          deal_id: dealId,
          created_by: brokerData.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchThreads();
      return data.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar conversa",
        variant: "destructive",
      });
      return null;
    }
  }, [user?.id, fetchThreads]);

  // Mark messages as read
  const markAsRead = useCallback(async (threadId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .neq('user_id', user.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user?.id]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!user?.id) return;

    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=in.(${threads.map(t => t.id).join(',')})`
        },
        (payload) => {
          const newMessage = payload.new as any;
          const message: Message = {
            id: newMessage.id,
            content: newMessage.content,
            sender_name: newMessage.sender_name,
            user_id: newMessage.user_id,
            thread_id: newMessage.thread_id,
            created_at: newMessage.created_at,
            is_read: newMessage.is_read || false
          };

          setMessages(prev => ({
            ...prev,
            [message.thread_id]: [
              ...(prev[message.thread_id] || []),
              message
            ]
          }));

          // Update thread's last message time in local state
          setThreads(prev => prev.map(thread =>
            thread.id === message.thread_id
              ? { ...thread, last_message_at: message.created_at }
              : thread
          ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

          // Send notification if message is from another user
          if (payload.new.user_id !== user?.id) {
            toast({
              title: "Nova mensagem",
              description: `${payload.new.sender_name || 'Usuário'}: ${payload.new.content.substring(0, 50)}${payload.new.content.length > 50 ? '...' : ''}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id, threads]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchThreads();
    }
  }, [user?.id, fetchThreads]);

  // Load messages when active thread changes
  useEffect(() => {
    if (activeThread && !messages[activeThread]) {
      fetchMessages(activeThread);
    }
  }, [activeThread, messages, fetchMessages]);

  return {
    threads,
    messages,
    loading,
    activeThread,
    setActiveThread,
    sendMessage,
    createThread,
    markAsRead,
    fetchMessages
  };
}