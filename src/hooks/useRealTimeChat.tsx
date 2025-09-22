import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBroker } from './useBroker';
import { toast } from '@/components/ui/use-toast';

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
  is_group: boolean;
  created_by: string;
  updated_at: string;
  created_at: string;
}

export function useRealTimeChat() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<{ [threadId: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    if (!broker?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  }, [broker?.id]);

  // Fetch messages for a thread
  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(prev => ({
        ...prev,
        [threadId]: (data || []).map(msg => ({
          id: msg.id,
          content: msg.body || '',
          sender_name: msg.sender_id, // Will need to resolve this
          user_id: msg.sender_id,
          thread_id: msg.thread_id,
          created_at: msg.created_at,
          is_read: true // Simplified for now
        }))
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (threadId: string, content: string) => {
    if (!broker?.id || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          body: content.trim(),
          sender_id: user?.id,
          attachments: []
        });

      if (error) throw error;

      // Update thread's updated_at
      await supabase
        .from('chat_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  }, [broker?.id, broker?.name, user?.id]);

  // Create new thread
  const createThread = useCallback(async (participantIds: string[], title?: string, dealId?: string) => {
    if (!broker?.id) return null;

    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .insert({
          is_group: participantIds.length > 1,
          title: title || 'Nova Conversa',
          created_by: broker.id
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
  }, [broker?.id, fetchThreads]);

  // Mark messages as read
  const markAsRead = useCallback(async (threadId: string) => {
    if (!broker?.id) return;

    try {
      // Use the chat-mark-read edge function instead
      await supabase.functions.invoke('chat-mark-read', {
        body: {
          thread_id: threadId
        }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [broker?.id]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!broker?.id) return;

    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as any;
          const message: Message = {
            id: newMessage.id,
            content: newMessage.body || '',
            sender_name: 'User', // Simplified
            user_id: newMessage.sender_id,
            thread_id: newMessage.thread_id,
            created_at: newMessage.created_at,
            is_read: false
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
              ? { ...thread, updated_at: message.created_at }
              : thread
          ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));

          // Show notification if not from current user
          if (message.user_id !== user?.id) {
            toast({
              title: "Nova mensagem",
              description: `${message.sender_name}: ${message.content.substring(0, 50)}...`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [broker?.id, threads]);

  // Initial load
  useEffect(() => {
    if (broker?.id) {
      fetchThreads();
    }
  }, [broker?.id, fetchThreads]);

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