import { useState, useEffect } from 'react';

interface PresentationState {
  isSketchReady: boolean;
  isDescriptionReady: boolean;
  isPlacesReady: boolean;
  isBrokerReady: boolean;
}

interface UsePropertyPresentationStateProps {
  isOpen: boolean;
  hasPhotos: boolean;
  placesLoading: boolean;
  brokerLoading: boolean;
}

export function usePropertyPresentationState({
  isOpen,
  hasPhotos,
  placesLoading,
  brokerLoading
}: UsePropertyPresentationStateProps) {
  const [state, setState] = useState<PresentationState>({
    isSketchReady: false,
    isDescriptionReady: false,
    isPlacesReady: false,
    isBrokerReady: false
  });

  const [isReadyForSharing, setIsReadyForSharing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Update individual states
  const updateSketchState = (ready: boolean) => {
    setState(prev => ({ ...prev, isSketchReady: ready }));
  };

  const updateDescriptionState = (ready: boolean) => {
    setState(prev => ({ ...prev, isDescriptionReady: ready }));
  };

  // Monitor external loading states
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isPlacesReady: !placesLoading,
      isBrokerReady: !brokerLoading
    }));
  }, [placesLoading, brokerLoading]);

  // Reset state when presentation closes
  useEffect(() => {
    if (!isOpen) {
      setState({
        isSketchReady: false,
        isDescriptionReady: false,
        isPlacesReady: false,
        isBrokerReady: false
      });
      setIsReadyForSharing(false);
      setLoadingProgress(0);
    }
  }, [isOpen]);

  // Calculate overall readiness and progress
  useEffect(() => {
    const totalSteps = 4;
    let completedSteps = 0;

    if (state.isSketchReady || !hasPhotos) completedSteps++;
    if (state.isDescriptionReady) completedSteps++;
    if (state.isPlacesReady) completedSteps++;
    if (state.isBrokerReady) completedSteps++;

    const progress = (completedSteps / totalSteps) * 100;
    setLoadingProgress(progress);
    
    // Only ready when all essential components are loaded
    const ready = completedSteps >= 3; // Allow sharing even if sketch fails
    setIsReadyForSharing(ready);
  }, [state, hasPhotos]);

  return {
    ...state,
    isReadyForSharing,
    loadingProgress,
    updateSketchState,
    updateDescriptionState
  };
}