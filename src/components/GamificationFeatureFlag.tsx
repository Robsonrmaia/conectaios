import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

interface GamificationFeatureFlagProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function GamificationFeatureFlag({ children, fallback = null }: GamificationFeatureFlagProps) {
  const { broker, loading: brokerLoading, createBrokerProfile } = useBroker();
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [retryCount, setRetryCount] = useState(0);
  const [creatingProfile, setCreatingProfile] = useState(false);

  // Retry mechanism
  const retryCheck = useCallback(() => {
    if (retryCount < 3) {
      console.log(`🔄 Retrying gamification check (attempt ${retryCount + 1})`);
      setRetryCount(prev => prev + 1);
      setTimeout(() => checkGamificationAccess(), 1000 * (retryCount + 1));
    }
  }, [retryCount]);

  useEffect(() => {
    // Reset retry count when broker changes
    if (broker?.id) {
      setRetryCount(0);
    }
    
    // Wait for auth and broker to load before checking access
    if (user && !brokerLoading) {
      checkGamificationAccess();
    }
  }, [user?.id, broker?.id, brokerLoading]);

  const checkGamificationAccess = async () => {
    try {
      console.log('🎮 Checking gamification access...', {
        brokerId: broker?.id,
        brokerStatus: broker?.status,
        userId: user?.id,
        brokerLoading,
        retryCount
      });

      // Enhanced fallback: If no broker profile exists, create it properly
      if (!broker?.id && user?.id && !creatingProfile) {
        console.log('⚠️ No broker profile found, creating one...');
        setCreatingProfile(true);
        
        try {
          // Use the proper broker hook to create profile
          await createBrokerProfile({
            name: user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
          });
          
          console.log('✅ Broker profile creation initiated');
          
          // Ensure gamification data exists
          const { data: brokerData } = await supabase
            .from('conectaios_brokers')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (brokerData?.id) {
            // Initialize gamification data if it doesn't exist
            const { error: gamError } = await supabase
              .from('gam_user_monthly')
              .upsert({
                usuario_id: brokerData.id,
                ano: new Date().getFullYear(),
                mes: new Date().getMonth() + 1,
                pontos: 0,
                tier: 'Sem Desconto',
                desconto_percent: 0,
                badges: []
              });

            if (gamError) {
              console.warn('Warning creating gamification data:', gamError);
            } else {
              console.log('✅ Gamification data initialized');
            }
          }
          
          // Allow access immediately after creation
          setEnabled(true);
          setDebugInfo({ developmentMode: true, reason: 'Profile created', brokerId: brokerData?.id });
          setLoading(false);
          setCreatingProfile(false);
          return;
          
        } catch (createError) {
          console.error('❌ Error creating broker profile:', createError);
          setCreatingProfile(false);
          
          // If profile creation fails, retry the check
          if (retryCount < 2) {
            retryCheck();
            return;
          } else {
            // After retries, still allow access for development
            console.log('🚧 Allowing access despite profile creation failure (dev mode)');
            setEnabled(true);
            setDebugInfo({ developmentMode: true, reason: 'Profile creation failed but allowing access' });
            setLoading(false);
            return;
          }
        }
      }

      // If we still don't have a broker after creation attempts, retry or fail gracefully
      if (!broker?.id && user?.id && !creatingProfile) {
        if (retryCount < 2) {
          console.log('⏳ Broker still loading, retrying...');
          retryCheck();
          return;
        } else {
          console.log('🚧 Allowing access despite missing broker (dev mode)');
          setEnabled(true);
          setDebugInfo({ developmentMode: true, reason: 'Missing broker after retries' });
          setLoading(false);
          return;
        }
      }

      // Proceed with normal access checks if we have a broker
      if (!broker?.id) {
        setEnabled(false);
        setDebugInfo({ reason: 'No broker profile and not authenticated' });
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
      const globallyEnabled = settingsMap.gamification_enabled === true || settingsMap.gamification_enabled === 'true';
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
          hasAccess = betaBrokers.includes(broker.id);
          accessReason = hasAccess ? 'Beta user' : 'Not in beta list';
          break;
        case 'pilot':
          hasAccess = betaBrokers.includes(broker.id) || pilotBrokers.includes(broker.id);
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
        brokerId: broker.id
      });

      setEnabled(hasAccess);
      setDebugInfo({
        rolloutPhase,
        hasAccess,
        accessReason,
        brokerId: broker.id,
        globallyEnabled
      });
    } catch (error) {
      console.error('❌ Error checking gamification access:', error);
      
      // On error, retry if possible, otherwise fail gracefully
      if (retryCount < 2) {
        retryCheck();
        return;
      }
      
      setEnabled(false);
      setDebugInfo({ error: error.message, retryCount });
    } finally {
      setLoading(false);
    }
  };

  if (loading || brokerLoading || creatingProfile) {
    return (
      <div className="flex items-center justify-center p-8 space-y-4">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
          {creatingProfile && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Configurando perfil de corretor...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎮 GamificationFeatureFlag debug:', debugInfo);
  }

  return enabled ? <>{children}</> : <>{fallback}</>;
}