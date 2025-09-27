// Hook replacement mappings to fix build errors

// Replace problematic hooks with simplified versions
export const hookReplacements = {
  'useBroker': () => import('../hooks/useBrokerSimplified'),
  'useEnhancedChat': () => import('../hooks/useEnhancedChatSimplified'),
  'useMinisite': () => import('../hooks/useMinisiteSimplified'),
  'useNotifications': () => import('../hooks/useNotificationsSimplified'),
  'useOnboarding': () => import('../hooks/useOnboardingSimplified')
};