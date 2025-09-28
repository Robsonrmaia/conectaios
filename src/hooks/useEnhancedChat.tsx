import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessageCompat } from '@/types/compat';
import { useAuth } from './useAuth';
import { useBroker } from './useBroker';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  attachments: any[];
  created_at: string;
  edited_at: string | null;
  sender_name?: string;
  sender_avatar?: string;
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
}

interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen_at: string;
  typing_in_thread?: string;
  updated_at: string;
}

export function useEnhancedChat() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<{ [threadId: string]: ChatMessage[] }>({});
  const [presence, setPresence] = useState<{ [userId: string]: UserPresence }>({});
  const [typingUsers, setTypingUsers] = useState<{ [threadId: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [threadId: string]: number }>({});
  
  const presenceChannel = useRef<any>(null);
  const typingTimeout = useRef<{ [threadId: string]: NodeJS.Timeout }>({});

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: threadsData, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Filter threads where user is participant
      const userThreads = [];
      for (const thread of threadsData || []) {
        const { data: participant } = await supabase
          .from('chat_participants')
          .select('*')
          .eq('thread_id', thread.id)
          .eq('user_id', user.id)
          .is('left_at', null)
          .single();

        if (participant) {
          // Get participants info
          const { data: participants } = await supabase
            .from('chat_participants')
            .select(`
              user_id,
              role,
              joined_at
            `)
            .eq('thread_id', thread.id)
            .is('left_at', null);

          // Get participant names
          const participantsWithNames = await Promise.all(
            (participants || []).map(async (p) => {
              const { data: brokerInfo } = await supabase
                .from('conectaios_brokers')
                .select('name, avatar_url')
                .eq('user_id', p.user_id)
                .single();

              if (!brokerInfo) {
                const { data: profileInfo } = await supabase
                  .from('profiles')
                  .select('nome')
                  .eq('user_id', p.user_id)
                  .single();

                return {
                  ...p,
                  name: profileInfo?.nome || 'Unknown User',
                  avatar_url: null
                };
              }

              return {
                ...p,
                name: brokerInfo.name,
                avatar_url: brokerInfo.avatar_url
              };
            })
          );

          // Get last message
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Calculate unread count (simplified)
          const { data: unreadMessages } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('thread_id', thread.id)
            .neq('sender_id', user.id);

          const unreadCount = unreadMessages?.length || 0;

          userThreads.push({
            ...thread,
            participants: participantsWithNames,
            last_message: lastMessage,
            unread_count: unreadCount,
            // Generate title for 1:1 chats
            title: thread.is_group 
              ? thread.title 
              : participantsWithNames?.find(p => p.user_id !== user.id)?.name || 'Chat'
          });
        }
      }

      setThreads(userThreads);
      
      // Update unread counts
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

  // Fetch messages for a specific thread
  const fetchMessages = useCallback(async (threadId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Add sender names
      const messagesWithInfo = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderInfo } = await supabase
            .from('conectaios_brokers')
            .select('name, avatar_url')
            .eq('user_id', msg.sender_id)
            .single();

          if (!senderInfo) {
            const { data: profileInfo } = await supabase
              .from('profiles')
              .select('nome')
              .eq('user_id', msg.sender_id)
              .single();

            return {
              ...msg,
              sender_name: profileInfo?.nome || 'Unknown User',
              sender_avatar: null,
            attachments: Array.isArray(msg.attachments) ? msg.attachments : []
            };
          }

          return {
            ...msg,
            sender_name: senderInfo.name,
            sender_avatar: senderInfo.avatar_url,
            attachments: Array.isArray(msg.attachments) ? msg.attachments : []
          };
        })
      );

      setMessages(prev => ({
        ...prev,
        [threadId]: messagesWithInfo.map(msg => ({
          ...msg,
          edited_at: (msg as any).edited_at || (msg as any).updated_at || (msg as any).created_at
        })) as any[]
      }));

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user?.id]);

  // Create or get 1:1 thread
  const createOrGetThread = useCallback(async (peerUserId: string) => {
    if (!user?.id) {
      console.error('No authenticated user found');
      toast({
        title: "Erro",
        description: "É necessário fazer login para iniciar uma conversa",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('Creating/getting thread for peer:', peerUserId);
      console.log('User ID:', user?.id);
      console.log('Calling edge function with body:', { peer_user_id: peerUserId });
      
      const { data, error } = await supabase.functions.invoke('chat-create-or-get-thread', {
        body: { peer_user_id: peerUserId }
      });

      console.log('Edge function response - data:', data);
      console.log('Edge function response - error:', error);

      if (error) {
        console.error('Edge function error details:', JSON.stringify(error, null, 2));
        throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data || !data.thread_id) {
        console.error('Invalid response data:', data);
        throw new Error('No thread ID returned from server');
      }

      console.log('Thread created/found:', data.thread_id);
      await fetchThreads();
      return data.thread_id;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar conversa",
        variant: "destructive",
      });
      return null;
    }
  }, [user?.id, fetchThreads]);

  // Create group thread
  const createGroup = useCallback(async (title: string, memberIds: string[]) => {
    if (!user?.id) return null;

    try {
      console.log('Creating group:', title, 'with members:', memberIds);
      
      const { data, error } = await supabase.functions.invoke('chat-create-thread', {
        body: { 
          is_group: true,
          title,
          members: memberIds
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to create group: ${error.message || 'Unknown error'}`);
      }

      if (!data || !data.thread_id) {
        throw new Error('No thread ID returned from server');
      }

      console.log('Group created:', data.thread_id);
      await fetchThreads();
      return data.thread_id;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar grupo",
        variant: "destructive",
      });
      return null;
    }
  }, [user?.id, fetchThreads]);

  // Send message
  const sendMessage = useCallback(async (threadId: string, body?: string, attachments?: any[]) => {
    if (!user?.id || (!body && (!attachments || attachments.length === 0))) return;

    try {
      const { data, error } = await supabase.functions.invoke('chat-send-message', {
        body: {
          thread_id: threadId,
          body,
          attachments: attachments || []
        }
      });

      if (error) throw error;

      return data.message_id;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  }, [user?.id]);

  // Mark messages as read
  const markAsRead = useCallback(async (threadId: string, messageIds?: string[]) => {
    if (!user?.id) return;

    try {
      await supabase.functions.invoke('chat-mark-read', {
        body: {
          thread_id: threadId,
          message_ids: messageIds
        }
      });

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
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
          updated_at: new Date().toISOString()
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
          updated_at: new Date().toISOString()
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
            description: newMessage.body ? newMessage.body.substring(0, 50) + '...' : 'Anexo recebido',
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