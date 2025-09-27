import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SimpleNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
  meta?: any;
}

export function useSimpleNotifications() {
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, type, read, created_at, meta')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const simpleNotifications: SimpleNotification[] = (data || []).map(item => ({
        id: item.id,
        title: item.title || '',
        body: item.body || '',
        type: item.type,
        read: item.read,
        created_at: item.created_at,
        meta: item.meta
      }));

      setNotifications(simpleNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead
  };
}