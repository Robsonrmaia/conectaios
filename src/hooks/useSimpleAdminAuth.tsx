import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useSimpleAdminAuth = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Simple admin check - in a real app, this should check against user roles
      const adminEmails = ['admin@conectaios.com', 'dev@conectaios.com'];
      setIsAdmin(adminEmails.includes(user.email || ''));
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  return {
    isAdmin,
    loading,
    user
  };
};