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
  last_seen: string;
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
    if (!user?.id) {
      console.log('🔴 fetchThreads: No user ID');
      return;
    }
    console.log('🔵 fetchThreads: Starting for user', user.id);

    try {
      const { data: threadsData, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('🔴 Error fetching threads:', error);
        throw error;
      }
      
      console.log('✅ Raw threads fetched:', threadsData?.length || 0);

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

      console.log('✅ Filtered user threads:', userThreads.length);
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
      
      // Use RPC function directly instead of edge function
      const { data: threadId, error } = await supabase.rpc('msg_create_or_get_direct', {
        target_user_id: peerUserId
      });

      console.log('RPC response - threadId:', threadId);
      console.log('RPC response - error:', error);

      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message || 'Failed to create/get thread');
      }

      if (!threadId) {
        throw new Error('No thread ID returned from database');
      }

      console.log('Thread created/found:', threadId);
      await fetchThreads();
      return threadId;
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
      
      // Use RPC function directly instead of edge function
      const { data: threadId, error } = await supabase.rpc('msg_create_group', {
        title: title,
        participant_ids: memberIds
      });

      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message || 'Failed to create group');
      }

      if (!threadId) {
        throw new Error('No thread ID returned from database');
      }

      console.log('Group created:', threadId);
      await fetchThreads();
      return threadId;
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
      // Usar RPC ao invés de edge function para evitar problemas de autenticação
      const { data: messageId, error } = await supabase
        .rpc('msg_send_message', {
          thread_id: threadId,
          content: body || ''
        });

      if (error) throw error;

      return messageId;
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
      // Simplificado: apenas atualiza o contador localmente
      // RLS já garante que só pode ver mensagens de threads que participa
      console.log('Marking thread as read:', threadId);
      
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
      console.log('Updating presence for user:', user.id, 'status:', status);
      
      const { error } = await supabase
        .from('chat_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Presence update error:', error);
      } else {
        console.log('Presence updated successfully');
      }
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