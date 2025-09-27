import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface OnboardingState {
  tour_completed: boolean;
  completed_at?: string;
}

export function useSimpleOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    tour_completed: false
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkOnboardingStatus = async () => {
    if (!user) return;

    // Por enquanto, usar localStorage como fallback
    const tourCompleted = localStorage.getItem(`tour_completed_${user.id}`) === 'true';
    
    setOnboardingState({
      tour_completed: tourCompleted,
      completed_at: tourCompleted ? new Date().toISOString() : undefined
    });
  };

  const completeTour = async () => {
    if (!user) return;

    try {
      // Salvar no localStorage por enquanto
      localStorage.setItem(`tour_completed_${user.id}`, 'true');
      
      setOnboardingState({
        tour_completed: true,
        completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completing tour:', error);
    }
  };

  const resetOnboarding = async () => {
    if (!user) return;

    try {
      localStorage.removeItem(`tour_completed_${user.id}`);
      
      setOnboardingState({
        tour_completed: false,
        completed_at: undefined
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  return {
    ...onboardingState,
    loading,
    completeTour,
    resetOnboarding,
    checkOnboardingStatus
  };
}