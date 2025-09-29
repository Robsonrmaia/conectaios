import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as msgApi from '@/integrations/messaging/api';

export function useMessaging() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<msgApi.Thread[]>([]);
  const [messages, setMessages] = useState<msgApi.Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string>();

  const loadThreads = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await msgApi.listMyThreads();
      setThreads(data);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    if (!threadId) return;
    
    try {
      const data = await msgApi.listMessages(threadId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startOneToOneThread = async (targetUserId: string): Promise<string> => {
    const thread = await msgApi.getOrCreateDMThread(targetUserId);
    return thread.id;
  };

  const sendMessage = async (threadId: string, text: string): Promise<msgApi.Message> => {
    const msg = await msgApi.sendMessage(threadId, text);
    return msg;
  };

  const searchUsers = async (query: string) => {
    if (!user?.id || !query.trim()) return [];
    return msgApi.listContacts(query);
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
      const unsub = msgApi.subscribeThread(activeThreadId, (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
      });

      return unsub;
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