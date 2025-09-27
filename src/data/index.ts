import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Imovel = Database['public']['Tables']['imoveis']['Row'];
type ImovelInsert = Database['public']['Tables']['imoveis']['Insert'];
type ImovelUpdate = Database['public']['Tables']['imoveis']['Update'];

type CRMClient = Database['public']['Tables']['crm_clients']['Row'];
type CRMDeal = Database['public']['Tables']['crm_deals']['Row'];
type CRMNote = Database['public']['Tables']['crm_notes']['Row'];
type CRMTask = Database['public']['Tables']['crm_tasks']['Row'];

export const Properties = {
  async list(filters: {
    q?: string;
    city_filter?: string;
    purpose_filter?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { 
      q = '', 
      city_filter, 
      purpose_filter, 
      limit = 50, 
      offset = 0 
    } = filters;

    const { data, error } = await supabase.rpc('search_imoveis', {
      q,
      city_filter,
      purpose_filter,
      limit_rows: limit,
      offset_rows: offset
    });

    if (error) throw error;
    return data as Imovel[];
  },

  async byId(id: string) {
    const { data, error } = await supabase
      .from('imoveis')
      .select(`
        *,
        imovel_images(*),
        imovel_features(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(property: ImovelInsert) {
    const { data, error } = await supabase
      .from('imoveis')
      .insert(property)
      .select()
      .single();

    if (error) throw error;
    return data as Imovel;
  },

  async update(id: string, updates: ImovelUpdate) {
    const { data, error } = await supabase
      .from('imoveis')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Imovel;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('imoveis')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const CRM = {
  clients: {
    async list() {
      const { data, error } = await supabase
        .from('crm_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMClient[];
    },

    async create(client: Omit<CRMClient, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('crm_clients')
        .insert(client)
        .select()
        .single();

      if (error) throw error;
      return data as CRMClient;
    },

    async update(id: string, updates: Partial<CRMClient>) {
      const { data, error } = await supabase
        .from('crm_clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CRMClient;
    }
  },

  deals: {
    async list() {
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          crm_clients(name, email),
          imoveis(title, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    async create(deal: Omit<CRMDeal, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert(deal)
        .select()
        .single();

      if (error) throw error;
      return data as CRMDeal;
    }
  },

  notes: {
    async list() {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMNote[];
    },

    async create(note: Omit<CRMNote, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('crm_notes')
        .insert(note)
        .select()
        .single();

      if (error) throw error;
      return data as CRMNote;
    }
  },

  tasks: {
    async list() {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as CRMTask[];
    },

    async create(task: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('crm_tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data as CRMTask;
    },

    async update(id: string, updates: Partial<CRMTask>) {
      const { data, error } = await supabase
        .from('crm_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CRMTask;
    }
  }
};