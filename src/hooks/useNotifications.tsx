import { useState } from 'react';
import { suppressTypes } from '@/utils/typeSuppress';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = async (notificationId: string) => {
    return;
  };

  const markAllAsRead = async () => {
    return;
  };

  const deleteNotification = async (notificationId: string) => {
    return;
  };

  const refetch = async () => {
    return;
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch
  };
}