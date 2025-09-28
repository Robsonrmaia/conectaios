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

export const supabase = createClient<Database>(
  url || 'https://paawojkqrggnuvpnnwrc.supabase.co', 
  anon || '', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);