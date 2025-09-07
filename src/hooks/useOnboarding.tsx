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
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('tour_completed, completed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding status:', error);
        return;
      }

      if (!data) {
        // Create initial onboarding record
        const { error: insertError } = await supabase
          .from('user_onboarding')
          .insert({
            user_id: user.id,
            tour_completed: false
          });

        if (insertError) {
          console.error('Error creating onboarding record:', insertError);
        }

        setOnboardingStatus({
          tourCompleted: false,
          completedAt: null
        });
      } else {
        setOnboardingStatus({
          tourCompleted: data.tour_completed,
          completedAt: data.completed_at
        });
      }
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
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