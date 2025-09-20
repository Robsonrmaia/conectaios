import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

interface GamificationFeatureFlagProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function GamificationFeatureFlag({ children, fallback = null }: GamificationFeatureFlagProps) {
  const { broker, loading: brokerLoading } = useBroker();
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Wait for broker to load before checking access
    if (!brokerLoading) {
      checkGamificationAccess();
    }
  }, [broker?.id, brokerLoading]);

  const checkGamificationAccess = async () => {
    try {
      console.log('🎮 Checking gamification access...', {
        brokerId: broker?.id,
        brokerStatus: broker?.status,
        userId: user?.id,
        brokerLoading
      });

      // Development fallback: If no broker profile exists, allow access for now
      if (!broker?.id && user?.id) {
        console.log('⚠️ No broker profile found, enabling for development');
        
        // Try to create missing broker profile data
        try {
          const { data: existingBroker } = await supabase
            .from('conectaios_brokers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingBroker) {
            console.log('📝 Creating missing broker profile...');
            const { data: newBroker, error: createError } = await supabase
              .from('conectaios_brokers')
              .insert({
                user_id: user.id,
                name: user.email?.split('@')[0] || 'Usuário',
                email: user.email || '',
                status: 'active',
                subscription_status: 'trial'
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating broker profile:', createError);
            } else {
              console.log('✅ Broker profile created:', newBroker.id);
            }
          }
        } catch (createError) {
          console.error('Error during broker profile creation:', createError);
        }

        // For development, allow access even without proper broker setup
        setEnabled(true);
        setDebugInfo({ developmentMode: true, reason: 'No broker profile' });
        setLoading(false);
        return;
      }

      // Get gamification settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['gamification_enabled', 'gamification_rollout_phase', 'gamification_beta_brokers', 'gamification_pilot_brokers']);

      const settingsMap = (settings || []).reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      console.log('⚙️ Gamification settings:', settingsMap);

      // Check if gamification is globally enabled
      const globallyEnabled = settingsMap.gamification_enabled === true;
      if (!globallyEnabled) {
        console.log('❌ Gamification globally disabled');
        setEnabled(false);
        setDebugInfo({ globallyEnabled: false });
        setLoading(false);
        return;
      }

      // Check rollout phase
      const rolloutPhase = settingsMap.gamification_rollout_phase || 'general';
      const betaBrokers = settingsMap.gamification_beta_brokers || [];
      const pilotBrokers = settingsMap.gamification_pilot_brokers || [];

      let hasAccess = false;
      let accessReason = '';

      switch (rolloutPhase) {
        case 'beta':
          hasAccess = betaBrokers.includes(broker?.id);
          accessReason = hasAccess ? 'Beta user' : 'Not in beta list';
          break;
        case 'pilot':
          hasAccess = betaBrokers.includes(broker?.id) || pilotBrokers.includes(broker?.id);
          accessReason = hasAccess ? 'Pilot user' : 'Not in pilot list';
          break;
        case 'general':
        default:
          hasAccess = true;
          accessReason = 'General rollout';
          break;
      }

      console.log('🎯 Access check result:', {
        rolloutPhase,
        hasAccess,
        accessReason,
        brokerId: broker?.id
      });

      setEnabled(hasAccess);
      setDebugInfo({
        rolloutPhase,
        hasAccess,
        accessReason,
        brokerId: broker?.id,
        globallyEnabled
      });
    } catch (error) {
      console.error('❌ Error checking gamification access:', error);
      setEnabled(false);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading || brokerLoading) {
    return (
      <div className="flex items-center justify-center p-8 space-y-4">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎮 GamificationFeatureFlag debug:', debugInfo);
  }

  return enabled ? <>{children}</> : <>{fallback}</>;
}