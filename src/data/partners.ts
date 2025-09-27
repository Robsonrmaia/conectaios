import { supabase } from '@/integrations/supabase/client';

export interface Partner {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePartnerInput {
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  active?: boolean;
}

export const partnersService = {
  async listMine(): Promise<Partner[]> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing partners:', error);
      throw error;
    }
  },

  async create(input: CreatePartnerInput): Promise<Partner> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('partners')
        .insert({
          user_id: user.id,
          name: input.name,
          logo_url: input.logo_url,
          website: input.website,
          description: input.description,
          active: input.active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<CreatePartnerInput>): Promise<Partner> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating partner:', error);
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing partner:', error);
      throw error;
    }
  },

  async toggleActive(id: string, active: boolean): Promise<Partner> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling partner active status:', error);
      throw error;
    }
  },

  async uploadLogo(file: File): Promise<string> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(`partners/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(`partners/${fileName}`);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading partner logo:', error);
      throw error;
    }
  }
};