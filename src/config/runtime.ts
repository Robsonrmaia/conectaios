// Centralized runtime configuration validation
export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key);
};

export const shouldShowLocalFallback = () => {
  return import.meta.env.DEV && !isSupabaseConfigured();
};