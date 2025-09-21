import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStatus {
  tourCompleted: boolean;
  completedAt: string | null;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('⚠️ Onboarding loading timeout - proceeding without onboarding');
          setLoading(false);
          setOnboardingStatus({ tourCompleted: true, completedAt: null }); // Default to completed
        }
      }, 2000);

      checkOnboardingStatus().finally(() => {
        clearTimeout(timeout);
      });

      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
      setOnboardingStatus(null);
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🎯 Checking onboarding status for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('tour_completed, completed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking onboarding status:', error);
        // Fallback to completed tour to prevent blocking
        setOnboardingStatus({ tourCompleted: true, completedAt: null });
        return;
      }

      if (data) {
        console.log('✅ Onboarding status loaded:', data.tour_completed);
        setOnboardingStatus({
          tourCompleted: data.tour_completed,
          completedAt: data.completed_at
        });
      } else {
        console.log('ℹ️ Creating initial onboarding record');
        // Create initial onboarding record
        const { error: insertError } = await supabase
          .from('user_onboarding')
          .insert({
            user_id: user.id,
            tour_completed: false
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating onboarding record:', insertError);
          // Fallback to completed tour to prevent blocking
          setOnboardingStatus({ tourCompleted: true, completedAt: null });
          return;
        }

        setOnboardingStatus({
          tourCompleted: false,
          completedAt: null
        });
      }
    } catch (error) {
      console.error('❌ Error in checkOnboardingStatus:', error);
      // Fallback to completed tour to prevent blocking
      setOnboardingStatus({ tourCompleted: true, completedAt: null });
    } finally {
      setLoading(false);
    }
  };

  const completeTour = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          tour_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error completing tour:', error);
        return;
      }

      setOnboardingStatus(prev => prev ? {
        ...prev,
        tourCompleted: true,
        completedAt: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Error in completeTour:', error);
    }
  };

  const shouldShowTour = () => {
    return onboardingStatus && !onboardingStatus.tourCompleted;
  };

  return {
    onboardingStatus,
    loading,
    shouldShowTour: shouldShowTour(),
    completeTour,
    checkOnboardingStatus
  };
}