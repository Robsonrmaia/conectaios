// Simple Supabase connection test
import { supabase } from '@/integrations/supabase/client';

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('imoveis')
      .select('id')
      .limit(1);

    return {
      status: 'connected',
      hasData: !!data,
      error: error?.message
    };
  } catch (error) {
    return {
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};