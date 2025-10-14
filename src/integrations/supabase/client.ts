import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Production: require both env vars
if (import.meta.env.MODE === 'production') {
  if (!url || !anon || url === '__REQUIRED__' || anon === '__REQUIRED__') {
    throw new Error('Missing Supabase environment variables in production');
  }
}

// Development: log warning if missing
if (import.meta.env.MODE === 'development' && (!url || !anon)) {
  console.warn('⚠️ Missing Supabase environment variables');
}

// Custom storage adapter to validate tokens before saving
const customStorageAdapter = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      // Validate tokens before saving
      const parsed = JSON.parse(value);
      
      if (parsed.refresh_token && parsed.refresh_token.length < 100) {
        console.error('❌ Tentativa de salvar refresh token truncado!');
        console.error('Length:', parsed.refresh_token.length);
        console.error('Token:', parsed.refresh_token.substring(0, 20) + '...');
        return; // Don't save invalid token
      }
      
      if (parsed.access_token && parsed.access_token.length < 500) {
        console.error('❌ Tentativa de salvar access token truncado!');
        console.error('Length:', parsed.access_token.length);
        return; // Don't save invalid token
      }
      
      window.localStorage.setItem(key, value);
      console.log('✅ Tokens válidos salvos com sucesso');
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Silent failure
    }
  },
};

export const supabase = createClient<any>(
  url || 'https://paawojkqrggnuvpnnwrc.supabase.co', 
  anon || '', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: customStorageAdapter,
      storageKey: 'sb-paawojkqrggnuvpnnwrc-auth-token',
      debug: import.meta.env.MODE === 'development'
    }
  }
);