import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from './useAdminAuth';

interface MaintenanceSettings {
  maintenanceMode: boolean;
  constructionMode: boolean;
  maintenanceMessage?: string;
  constructionMessage?: string;
  estimatedTime?: string;
}

export function useMaintenanceMode() {
  const [settings, setSettings] = useState<MaintenanceSettings>({ 
    maintenanceMode: false,
    constructionMode: false 
  });
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdminAuth();

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      // Buscar configurações do banco de dados
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['maintenance_mode', 'construction_mode']);

      if (error) {
        console.error('Error checking maintenance mode:', error);
        // Fallback para localStorage se banco falhar
        const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
        setSettings({ maintenanceMode, constructionMode: false });
      } else {
        const maintenanceData = data?.find(item => item.key === 'maintenance_mode')?.value as any;
        const constructionData = data?.find(item => item.key === 'construction_mode')?.value as any;
        
        setSettings({
          maintenanceMode: maintenanceData?.enabled || false,
          constructionMode: constructionData?.enabled || false,
          maintenanceMessage: maintenanceData?.message,
          constructionMessage: constructionData?.message,
          estimatedTime: maintenanceData?.estimated_time || constructionData?.estimated_time
        });
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      // Fallback para localStorage
      const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
      setSettings({ maintenanceMode, constructionMode: false });
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceMode = async (enabled: boolean, message?: string, estimatedTime?: string) => {
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: { 
            enabled, 
            message: message || 'Sistema em manutenção. Voltaremos em breve!',
            estimated_time: estimatedTime 
          }
        })
        .eq('key', 'maintenance_mode');

      if (error) {
        console.error('Error updating maintenance mode:', error);
        // Fallback para localStorage
        localStorage.setItem('maintenanceMode', enabled.toString());
        return { success: false, error };
      }
      
      setSettings(prev => ({ 
        ...prev, 
        maintenanceMode: enabled, 
        maintenanceMessage: message,
        estimatedTime 
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      return { success: false, error };
    }
  };

  const updateConstructionMode = async (enabled: boolean, message?: string, estimatedTime?: string) => {
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: { 
            enabled, 
            message: message || 'Estamos trabalhando em melhorias. Em breve teremos novidades!',
            estimated_time: estimatedTime 
          }
        })
        .eq('key', 'construction_mode');

      if (error) {
        console.error('Error updating construction mode:', error);
        return { success: false, error };
      }
      
      setSettings(prev => ({ 
        ...prev, 
        constructionMode: enabled, 
        constructionMessage: message,
        estimatedTime 
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating construction mode:', error);
      return { success: false, error };
    }
  };

  const shouldShowMaintenancePage = () => {
    return (settings.maintenanceMode || settings.constructionMode) && !isAdmin;
  };

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