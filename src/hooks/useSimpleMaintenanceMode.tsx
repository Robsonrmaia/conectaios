import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAdminAuth } from './useSimpleAdminAuth';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  estimated_time: string;
}

export function useSimpleMaintenanceMode() {
  const [settings, setSettings] = useState({
    maintenance_mode: { enabled: false, message: 'Sistema em manutenção', estimated_time: '' },
    construction_mode: { enabled: false, message: 'Site em construção', estimated_time: '' }
  });
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useSimpleAdminAuth();

  const checkMaintenanceMode = async () => {
    setLoading(true);
    try {
      // Buscar configurações de manutenção
      const { data: maintenanceData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      const { data: constructionData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'construction_mode')
        .single();

      if (maintenanceData?.value) {
        setSettings(prev => ({
          ...prev,
          maintenance_mode: maintenanceData.value as unknown as MaintenanceSettings
        }));
      }

      if (constructionData?.value) {
        setSettings(prev => ({
          ...prev,
          construction_mode: constructionData.value as unknown as MaintenanceSettings
        }));
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceMode = async (newSettings: MaintenanceSettings) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert([{
          key: 'maintenance_mode',
          value: newSettings as any
        }]);

      if (!error) {
        setSettings(prev => ({
          ...prev,
          maintenance_mode: newSettings
        }));
      }
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
    }
  };

  const updateConstructionMode = async (newSettings: MaintenanceSettings) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert([{
          key: 'construction_mode',
          value: newSettings as any
        }]);

      if (!error) {
        setSettings(prev => ({
          ...prev,
          construction_mode: newSettings
        }));
      }
    } catch (error) {
      console.error('Error updating construction mode:', error);
    }
  };

  const shouldShowMaintenancePage = () => {
    return !isAdmin && (settings.maintenance_mode.enabled || settings.construction_mode.enabled);
  };

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  return {
    settings,
    loading,
    isAdmin,
    shouldShowMaintenancePage,
    updateMaintenanceMode,
    updateConstructionMode,
    checkMaintenanceMode
  };
}