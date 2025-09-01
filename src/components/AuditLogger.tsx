import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuditLoggerProps {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
}

export const AuditLogger = ({ action, resourceType, resourceId, oldValues, newValues }: AuditLoggerProps) => {
  const { user } = useAuth();

  useEffect(() => {
    const logEvent = async () => {
      if (!user) return;

      try {
        await supabase.rpc('log_audit_event', {
          _action: action,
          _resource_type: resourceType,
          _resource_id: resourceId || null,
          _old_values: oldValues || null,
          _new_values: newValues || null
        });
      } catch (error) {
        console.error('Failed to log audit event:', error);
      }
    };

    logEvent();
  }, [action, resourceType, resourceId, oldValues, newValues, user]);

  return null; // This component doesn't render anything
};

// Hook for easy logging
export const useAuditLog = () => {
  const { user } = useAuth();

  const logEvent = async (action: string, resourceType: string, resourceId?: string, oldValues?: any, newValues?: any) => {
    if (!user) return;

    try {
      await supabase.rpc('log_audit_event', {
        _action: action,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _old_values: oldValues || null,
        _new_values: newValues || null
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  return { logEvent };
};

export default AuditLogger;