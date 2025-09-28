// Runtime environment validation helpers

export function requireEnv(key: string): string {
  const v = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  if (!v || v === '__REQUIRED__') {
    if (import.meta.env.MODE === 'production') {
      throw new Error(`Missing env ${key}`);
    }
    console.warn(`[DEV] Missing env ${key}`); 
  }
  return v ?? '';
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== '__REQUIRED__' && key !== '__REQUIRED__');
}

export function shouldShowLocalFallback(): boolean {
  return import.meta.env.MODE === 'development' && !isSupabaseConfigured();
}

export const RUNTIME = {
  ENVIRONMENT: import.meta.env.MODE || 'development',
  IS_DEVELOPMENT: import.meta.env.MODE === 'development',
  IS_PRODUCTION: import.meta.env.MODE === 'production',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://paawojkqrggnuvpnnwrc.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const;

export const healthCheck = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: RUNTIME.ENVIRONMENT,
});