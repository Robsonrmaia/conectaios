import { useState } from 'react';

export function useOnboarding() {
  const [onboardingStatus, setOnboardingStatus] = useState({ tourCompleted: true, completedAt: null });
  const [loading, setLoading] = useState(false);

  const completeTour = async () => {
    setOnboardingStatus({ tourCompleted: true, completedAt: new Date().toISOString() });
  };

  const checkOnboardingStatus = async () => {
    return;
  };

  return {
    onboardingStatus,
    loading,
    shouldShowTour: false,
    completeTour,
    checkOnboardingStatus
  };
}