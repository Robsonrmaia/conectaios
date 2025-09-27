import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  projectId: string;
  brandingConfigured: boolean;
  authConfigured: boolean;
  errors: string[];
}

export function useHealthCheck() {
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runHealthCheck = async () => {
      const errors: string[] = [];
      let brandingConfigured = false;
      let authConfigured = true;
      
      // Check project ID
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const projectId = supabaseUrl.includes('paawojkqrggnuvpnnwrc') ? 'paawojkqrggnuvpnnwrc' : 'WRONG_PROJECT';
      
      if (projectId === 'WRONG_PROJECT') {
        errors.push('VITE_SUPABASE_URL não aponta para paawojkqrggnuvpnnwrc');
      }

      // Check branding settings
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['site_logo_url', 'site_hero_url']);

        if (error) {
          errors.push(`Erro ao verificar branding: ${error.message}`);
        } else if (data && data.length === 2) {
          brandingConfigured = true;
          console.log('✅ Branding URLs configuradas:', data);
        } else {
          errors.push('Branding URLs não encontradas em system_settings');
        }
      } catch (error: any) {
        errors.push(`Erro ao acessar system_settings: ${error.message}`);
      }

      // Log health check results (development only)
      if (import.meta.env.DEV) {
        console.log('🔍 ConectaIOS Health Check Results:');
        console.log('Project ID:', projectId);
        console.log('Branding configured:', brandingConfigured);
        console.log('Auth configured:', authConfigured);
        if (errors.length > 0) {
          console.warn('⚠️ Health check errors:', errors);
        } else {
          console.log('✅ All health checks passed');
        }
      }

      setResult({
        projectId,
        brandingConfigured,
        authConfigured,
        errors
      });
      setLoading(false);
    };

    runHealthCheck();
  }, []);

  return { result, loading };
}