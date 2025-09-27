import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
}

interface ChatThread {
  id: string;
  title?: string;
  is_group: boolean;
}

export const useSimpleEnhancedChat = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const createOrGetThread = useCallback(async (peerUserId: string) => {
    try {
      setLoading(true);
      
      // Use the edge function to create or get thread
      const { data, error } = await supabase.functions.invoke('chat-create-or-get-thread', {
        body: { peer_user_id: peerUserId }
      });

      if (error) throw error;
      
      return data.thread_id;
    } catch (error) {
      console.error('Error creating/getting thread:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (threadId: string, body: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-send-message', {
        body: { 
          thread_id: threadId,
          body: body
        }
      });

      if (error) throw error;
      
      return data.message_id;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, []);

  const markAsRead = useCallback(async (threadId: string, messageIds?: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-mark-read', {
        body: { 
          thread_id: threadId,
          message_ids: messageIds
        }
      });

      if (error) throw error;
      
      return data.marked_as_read;
    } catch (error) {
      console.error('Error marking as read:', error);
      return 0;
    }
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      
      // For now, return empty array since we need the types to be generated first
      setThreads([]);
      
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setLoading(true);
      
      // For now, return empty array since we need the types to be generated first
      setMessages([]);
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    threads,
    messages,
    loading,
    createOrGetThread,
    sendMessage,
    markAsRead,
    loadThreads,
    loadMessages
  };
};