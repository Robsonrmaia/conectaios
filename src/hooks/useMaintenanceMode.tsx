import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from './useAdminAuth';

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

export function useMaintenanceMode() {
  const [settings, setSettings] = useState<MaintenanceSettings>({ maintenanceMode: false });
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdminAuth();

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      // Check if maintenance settings exist in profiles metadata or a separate table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (error) {
        console.error('Error checking maintenance mode:', error);
      } else {
        // For now, we'll use localStorage as a simple solution
        const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
        setSettings({ maintenanceMode });
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceMode = async (enabled: boolean, message?: string) => {
    try {
      // Save to localStorage for now (in production you'd use a proper database)
      localStorage.setItem('maintenanceMode', enabled.toString());
      if (message) {
        localStorage.setItem('maintenanceMessage', message);
      }
      
      setSettings({ maintenanceMode: enabled, maintenanceMessage: message });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      return { success: false, error };
    }
  };

  const shouldShowMaintenancePage = () => {
    return settings.maintenanceMode && !isAdmin;
  };

  return {
    settings,
    loading,
    isAdmin,
    shouldShowMaintenancePage,
    updateMaintenanceMode,
    checkMaintenanceMode
  };
}