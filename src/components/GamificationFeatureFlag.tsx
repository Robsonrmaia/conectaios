import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';

interface GamificationFeatureFlagProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function GamificationFeatureFlag({ children, fallback = null }: GamificationFeatureFlagProps) {
  const { broker } = useBroker();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGamificationAccess();
  }, [broker?.id]);

  const checkGamificationAccess = async () => {
    try {
      // Get gamification settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['gamification_enabled', 'gamification_rollout_phase', 'gamification_beta_brokers', 'gamification_pilot_brokers']);

      const settingsMap = (settings || []).reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      // Check if gamification is globally enabled
      const globallyEnabled = settingsMap.gamification_enabled === true;
      if (!globallyEnabled) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      // Check rollout phase
      const rolloutPhase = settingsMap.gamification_rollout_phase || 'general';
      const betaBrokers = settingsMap.gamification_beta_brokers || [];
      const pilotBrokers = settingsMap.gamification_pilot_brokers || [];

      let hasAccess = false;

      switch (rolloutPhase) {
        case 'beta':
          hasAccess = betaBrokers.includes(broker?.id);
          break;
        case 'pilot':
          hasAccess = betaBrokers.includes(broker?.id) || pilotBrokers.includes(broker?.id);
          break;
        case 'general':
        default:
          hasAccess = true;
          break;
      }

      setEnabled(hasAccess);
    } catch (error) {
      console.error('Error checking gamification access:', error);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return enabled ? <>{children}</> : <>{fallback}</>;
}