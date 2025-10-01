import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_avatar?: string;
  is_read?: boolean;
}

interface ChatThread {
  id: string;
  is_group: boolean;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: any[];
  last_message?: ChatMessage;
  unread_count?: number;
  other_participant?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_online?: boolean;
  };
}

interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  typing_in_thread?: string;
  updated_at: string;
}

export function useEnhancedChat() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<{ [threadId: string]: ChatMessage[] }>({});
  const [presence, setPresence] = useState<{ [userId: string]: UserPresence }>({});
  const [typingUsers, setTypingUsers] = useState<{ [threadId: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [threadId: string]: number }>({});
  
  const presenceChannel = useRef<any>(null);
  const typingTimeout = useRef<{ [threadId: string]: NodeJS.Timeout }>({});

  // Fetch threads usando RPC otimizado
  const fetchThreads = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data: threadsData, error } = await supabase
        .rpc('msg_get_user_threads', { p_user_id: user.id });

      if (error) throw error;

      const userThreads = (threadsData || []).map((thread: any) => ({
        id: thread.thread_id,
        is_group: thread.is_group,
        title: thread.title,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        created_by: thread.created_by || user.id,
        last_message: thread.last_message_content ? {
          id: thread.last_message_id,
          content: thread.last_message_content,
          created_at: thread.last_message_at,
          sender_id: thread.last_message_sender_id,
          sender_name: thread.last_message_sender_name,
          thread_id: thread.thread_id,
          attachments: [],
          updated_at: thread.last_message_at
        } : undefined,
        unread_count: thread.unread_count || 0,
        other_participant: thread.other_participant_id ? {
          id: thread.other_participant_id,
          name: thread.other_participant_name,
          avatar_url: thread.other_participant_avatar,
          is_online: thread.other_participant_online
        } : undefined
      }));

      setThreads(userThreads);
      
      const counts: { [key: string]: number } = {};
      userThreads.forEach(thread => {
        counts[thread.id] = thread.unread_count || 0;
      });
      setUnreadCounts(counts);

    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch messages usando RPC otimizado
  const fetchMessages = useCallback(async (threadId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('msg_get_thread_messages', {
          p_thread_id: threadId,
          p_user_id: user.id,
          p_limit: 50,
          p_offset: 0
        });

      if (error) throw error;

      const messagesWithInfo = (data || []).map((msg: any) => ({
        id: msg.id,
        thread_id: msg.thread_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender_name: msg.sender_name,
        sender_avatar: msg.sender_avatar,
        is_read: msg.is_read,
        attachments: []
      }));

      setMessages(prev => ({
        ...prev,
        [threadId]: messagesWithInfo
      }));

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user?.id]);

  // Create or get 1:1 thread usando edge function
  const createOrGetThread = useCallback(async (peerUserId: string) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "É necessário fazer login para iniciar uma conversa",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Primeiro tenta encontrar thread existente
      const { data: existingThread } = await supabase
        .from('chat_threads')
        .select(`
          id,
          chat_participants!inner(user_id)
        `)
        .eq('is_group', false)
        .eq('chat_participants.user_id', user.id)
        .limit(1)
        .single();

      if (existingThread) {
        // Verifica se o outro usuário também está na thread
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('thread_id', existingThread.id)
          .in('user_id', [user.id, peerUserId]);

        if (participants && participants.length === 2) {
          await fetchThreads();
          return existingThread.id;
        }
      }

      // Se não existe, cria nova thread
      const { data: newThread, error: threadError } = await supabase
        .from('chat_threads')
        .insert({
          is_group: false,
          created_by: user.id,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Adiciona participantes
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { thread_id: newThread.id, user_id: user.id, role: 'member' },
          { thread_id: newThread.id, user_id: peerUserId, role: 'member' }
        ]);

      if (participantsError) throw participantsError;

      await fetchThreads();
      return newThread.id;
      
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

  // Create group thread
  const createGroup = useCallback(async (title: string, memberIds: string[]) => {
    if (!user?.id) return null;

    try {
      // Cria nova thread de grupo
      const { data: newThread, error: threadError } = await supabase
        .from('chat_threads')
        .insert({
          is_group: true,
          title: title,
          created_by: user.id,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Adiciona todos os participantes
      const participants = [user.id, ...memberIds].map(userId => ({
        thread_id: newThread.id,
        user_id: userId,
        role: 'member'
      }));

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      await fetchThreads();
      return newThread.id;
      
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar grupo",
        variant: "destructive",
      });
      return null;
    }
  }, [user?.id, fetchThreads]);

  // Send message usando insert direto
  const sendMessage = useCallback(async (threadId: string, body?: string, attachments?: any[]) => {
    if (!user?.id) return;
    if (!body?.trim() && (!attachments || attachments.length === 0)) return;

    try {
      console.log('📤 Sending message:', { threadId, body, attachments });
      
      // Get authenticated user
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) {
        throw new Error('not-authenticated');
      }

      // Insert message directly using Supabase client
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: authData.user.id,
          body: body?.trim() || '',
          type: 'text',
          status: 'sent'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ RLS or insert error:', error);
        throw error;
      }
      
      console.log('✅ Message sent successfully:', data);

      // Atualiza mensagens localmente
      await fetchMessages(threadId);
      await fetchThreads();

      return data.id;
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  }, [user?.id, fetchMessages, fetchThreads]);

  // Mark messages as read usando edge function
  const markAsRead = useCallback(async (threadId: string, messageIds?: string[]) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.functions.invoke('chat-mark-read', {
        body: {
          thread_id: threadId,
          message_ids: messageIds
        }
      });

      if (error) throw error;

      setUnreadCounts(prev => ({
        ...prev,
        [threadId]: 0
      }));

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user?.id]);

  // Update presence
  const updatePresence = useCallback(async (status: 'online' | 'offline' | 'away') => {
    if (!user?.id) return;

    try {
      await supabase
        .from('chat_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user?.id]);

  // Start typing indicator
  const startTyping = useCallback(async (threadId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('chat_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          typing_in_thread: threadId,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (typingTimeout.current[threadId]) {
        clearTimeout(typingTimeout.current[threadId]);
      }

      typingTimeout.current[threadId] = setTimeout(() => {
        stopTyping(threadId);
      }, 3000);

    } catch (error) {
      console.error('Error starting typing:', error);
    }
  }, [user?.id]);

  // Stop typing indicator
  const stopTyping = useCallback(async (threadId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('chat_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          typing_in_thread: null,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (typingTimeout.current[threadId]) {
        clearTimeout(typingTimeout.current[threadId]);
        delete typingTimeout.current[threadId];
      }

    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  }, [user?.id]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const messagesChannel = supabase
      .channel('chat-messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        
        setMessages(prev => ({
          ...prev,
          [newMessage.thread_id]: [
            ...(prev[newMessage.thread_id] || []),
            {
              ...newMessage,
              sender_name: 'Loading...',
              attachments: Array.isArray(newMessage.attachments) ? newMessage.attachments : []
            }
          ]
        }));

        fetchThreads();

        if (newMessage.sender_id !== user.id) {
          toast({
            title: "Nova mensagem",
            description: newMessage.content ? newMessage.content.substring(0, 50) + '...' : 'Anexo recebido',
          });
        }
      })
      .subscribe();

    presenceChannel.current = supabase
      .channel('chat-presence-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_presence'
      }, (payload) => {
        const presenceData = payload.new as UserPresence;
        
        setPresence(prev => ({
          ...prev,
          [presenceData.user_id]: presenceData
        }));

        if (presenceData.typing_in_thread) {
          setTypingUsers(prev => ({
            ...prev,
            [presenceData.typing_in_thread!]: [
              ...(prev[presenceData.typing_in_thread!] || []).filter(id => id !== presenceData.user_id),
              presenceData.user_id
            ]
          }));
        } else {
          setTypingUsers(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(threadId => {
              updated[threadId] = updated[threadId].filter(id => id !== presenceData.user_id);
            });
            return updated;
          });
        }
      })
      .subscribe();

    updatePresence('online');

    return () => {
      supabase.removeChannel(messagesChannel);
      if (presenceChannel.current) {
        supabase.removeChannel(presenceChannel.current);
      }
      Object.values(typingTimeout.current).forEach(timeout => clearTimeout(timeout));
      updatePresence('offline');
    };
  }, [user?.id, fetchThreads, updatePresence]);

  useEffect(() => {
    if (user?.id) {
      fetchThreads();
    }
  }, [user?.id, fetchThreads]);

  useEffect(() => {
    if (activeThread && !messages[activeThread]) {
      fetchMessages(activeThread);
    }
  }, [activeThread, messages, fetchMessages]);

  useEffect(() => {
    if (activeThread && unreadCounts[activeThread] > 0) {
      markAsRead(activeThread);
    }
  }, [activeThread, unreadCounts, markAsRead]);

  return {
    threads,
    messages,
    presence,
    typingUsers,
    loading,
    activeThread,
    unreadCounts,
    setActiveThread,
    createOrGetThread,
    createGroup,
    sendMessage,
    markAsRead,
    updatePresence,
    startTyping,
    stopTyping,
    fetchMessages,
    refreshThreads: fetchThreads
  };
}