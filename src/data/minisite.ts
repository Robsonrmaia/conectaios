import { supabase } from '@/integrations/supabase/client';

export interface MinisiteConfig {
  id?: string;
  user_id?: string;
  title: string;
  primary_color: string;
  secondary_color: string;
  template_id: string;
  show_properties: boolean;
  show_contact: boolean;
  show_about: boolean;
  custom_domain?: string;
  created_at?: string;
  updated_at?: string;
}

export const minisiteService = {
  async getConfig(): Promise<MinisiteConfig | null> {
    try {
      const { data, error } = await supabase
        .from('minisite_configs')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (error) throw error;

      // Se não existe config, criar uma padrão
      if (!data) {
        const { data: newConfig, error: createError } = await supabase.rpc('ensure_minisite_for_user', {
          p_user: (await supabase.auth.getUser()).data.user?.id
        });
        
        if (createError) throw createError;

        // Buscar a config criada
        const { data: createdConfig, error: fetchError } = await supabase
          .from('minisite_configs')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (fetchError) throw fetchError;
        return createdConfig;
      }

      return data;
    } catch (error) {
      console.error('Error getting minisite config:', error);
      throw error;
    }
  },

  async upsertConfig(config: Partial<MinisiteConfig>): Promise<MinisiteConfig> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('minisite_configs')
        .upsert({
          user_id: user.id,
          ...config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting minisite config:', error);
      throw error;
    }
  }
};