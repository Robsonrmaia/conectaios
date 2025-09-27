import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ============= TYPE DEFINITIONS =============

// Supabase table types
export type Imovel = Tables<'imoveis'>;
export type ImovelInsert = TablesInsert<'imoveis'>;
export type ImovelUpdate = TablesUpdate<'imoveis'>;

export type CRMClient = Tables<'crm_clients'>;
export type CRMClientInsert = TablesInsert<'crm_clients'>;
export type CRMClientUpdate = TablesUpdate<'crm_clients'>;

export type CRMDeal = Tables<'crm_deals'>;
export type CRMDealInsert = TablesInsert<'crm_deals'>;
export type CRMDealUpdate = TablesUpdate<'crm_deals'>;

export type CRMNote = Tables<'crm_notes'>;
export type CRMNoteInsert = TablesInsert<'crm_notes'>;

export type CRMTask = Tables<'crm_tasks'>;
export type CRMTaskInsert = TablesInsert<'crm_tasks'>;
export type CRMTaskUpdate = TablesUpdate<'crm_tasks'>;

export type Broker = Tables<'brokers'>;
export type Profile = Tables<'profiles'>;

// Extended types for joins
export interface BrokerWithProfile extends Broker {
  profiles?: Profile | null;
}

export interface CRMClientExtended extends CRMClient {
  broker?: BrokerWithProfile | null;
}

export interface CRMDealExtended extends CRMDeal {
  client?: CRMClient | null;
  property?: Imovel | null;
}

// Legacy compatibility types
export interface Property {
  id: string;
  title: string;
  description?: string;
  type?: string;
  purpose: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_total?: number;
  city?: string;
  neighborhood?: string;
  status?: string;
  created_at?: string;
  owner_id?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_locations?: string[];
  notes?: string;
  created_at?: string;
}

export interface Deal {
  id: string;
  client_id?: string;
  property_id?: string;
  status?: string;
  offer_amount?: number;
  commission_amount?: number;
  notes?: string;
  created_at?: string;
}

// ============= TRANSFORMATION FUNCTIONS =============

export function imovelToProperty(imovel: Imovel): Property {
  return {
    id: imovel.id,
    title: imovel.title,
    description: imovel.description || undefined,
    type: imovel.type || undefined,
    purpose: imovel.purpose,
    price: imovel.price ? Number(imovel.price) : undefined,
    bedrooms: imovel.bedrooms || undefined,
    bathrooms: imovel.bathrooms || undefined,
    area_total: imovel.area_total ? Number(imovel.area_total) : undefined,
    city: imovel.city || undefined,
    neighborhood: imovel.neighborhood || undefined,
    status: imovel.status || undefined,
    created_at: imovel.created_at || undefined,
    owner_id: imovel.owner_id
  };
}

export function crmClientToClient(client: CRMClient): Client {
  return {
    id: client.id,
    name: client.name,
    email: client.email || undefined,
    phone: client.phone || undefined,
    budget_min: client.budget_min ? Number(client.budget_min) : undefined,
    budget_max: client.budget_max ? Number(client.budget_max) : undefined,
    preferred_locations: client.preferred_locations || undefined,
    notes: client.notes || undefined,
    created_at: client.created_at || undefined
  };
}

export function crmDealToDeal(deal: CRMDeal): Deal {
  return {
    id: deal.id,
    client_id: deal.client_id || undefined,
    property_id: deal.property_id || undefined,
    status: deal.status || undefined,
    offer_amount: deal.offer_amount ? Number(deal.offer_amount) : undefined,
    commission_amount: deal.commission_amount ? Number(deal.commission_amount) : undefined,
    notes: deal.notes || undefined,
    created_at: deal.created_at || undefined
  };
}

// ============= PROPERTIES DATA ACCESS =============

export const Properties = {
  async list(filters: {
    q?: string;
    city_filter?: string;
    purpose_filter?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Imovel[]> {
    const { data, error } = await supabase.rpc('search_imoveis', {
      q: filters.q || '',
      city_filter: filters.city_filter || null,
      purpose_filter: filters.purpose_filter || null,
      limit_rows: filters.limit || 50,
      offset_rows: filters.offset || 0
    });
    if (error) throw error;
    return data || [];
  },

  async search(params: {
    query?: string;
    city?: string;
    purpose?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Imovel[]> {
    return this.list({
      q: params.query,
      city_filter: params.city,
      purpose_filter: params.purpose,
      limit: params.limit,
      offset: params.offset
    });
  },

  async findMatches(brokerId: string, filters: any = {}): Promise<Imovel[]> {
    const { data, error } = await supabase.rpc('find_property_matches', {
      p_broker_id: brokerId,
      p_filters: filters,
      p_limit: 50,
      p_offset: 0
    });
    if (error) throw error;
    return data || [];
  },

  async findIntelligentMatches(query: string = '', city: string | null = null): Promise<Imovel[]> {
    const { data, error } = await supabase.rpc('find_intelligent_property_matches', {
      p_query: query,
      p_city: city,
      p_limit: 50,
      p_offset: 0
    });
    if (error) throw error;
    return data || [];
  },

  async byId(id: string): Promise<any> {
    const { data: imovel, error: imovelError } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', id)
      .single();

    if (imovelError) throw imovelError;

    const { data: images, error: imagesError } = await supabase
      .from('imovel_images')
      .select('*')
      .eq('imovel_id', id)
      .order('position');

    if (imagesError) throw imagesError;

    const { data: features, error: featuresError } = await supabase
      .from('imovel_features')
      .select('*')
      .eq('imovel_id', id);

    if (featuresError) throw featuresError;

    return {
      ...imovel,
      images: images || [],
      features: features || []
    };
  },

  async create(property: ImovelInsert): Promise<Imovel> {
    const { data, error } = await supabase
      .from('imoveis')
      .insert(property)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: ImovelUpdate): Promise<Imovel> {
    const { data, error } = await supabase
      .from('imoveis')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('imoveis').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============= CRM DATA ACCESS =============

export const CRM = {
  brokers: {
    async list(): Promise<BrokerWithProfile[]> {
      const { data, error } = await supabase
        .from('brokers')
        .select(`
          *,
          profiles (*)
        `);
      if (error) throw error;
      return data || [];
    },

    async listSimple(): Promise<Broker[]> {
      const { data, error } = await supabase.from('brokers').select('*');
      if (error) throw error;
      return data || [];
    },

    async create(broker: TablesInsert<'brokers'>): Promise<Broker> {
      const { data, error } = await supabase
        .from('brokers')
        .insert(broker)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  profiles: {
    async updateRole(userId: string, role: 'admin' | 'broker' | 'user'): Promise<void> {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      if (error) throw error;
    }
  },

  clients: {
    async list(): Promise<CRMClient[]> {
      const { data, error } = await supabase
        .from('crm_clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async listLegacy(): Promise<Client[]> {
      const clients = await this.list();
      return clients.map(crmClientToClient);
    },

    async create(client: CRMClientInsert): Promise<CRMClient> {
      const { data, error } = await supabase
        .from('crm_clients')
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: CRMClientUpdate): Promise<CRMClient> {
      const { data, error } = await supabase
        .from('crm_clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  deals: {
    async list(): Promise<CRMDealExtended[]> {
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          crm_clients (*),
          imoveis (*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async listLegacy(): Promise<Deal[]> {
      const { data, error } = await supabase
        .from('crm_deals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(crmDealToDeal);
    },

    async create(deal: CRMDealInsert): Promise<CRMDeal> {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert(deal)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  notes: {
    async list(): Promise<CRMNote[]> {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async create(note: CRMNoteInsert): Promise<CRMNote> {
      const { data, error } = await supabase
        .from('crm_notes')
        .insert(note)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  tasks: {
    async list(): Promise<CRMTask[]> {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async create(task: CRMTaskInsert): Promise<CRMTask> {
      const { data, error } = await supabase
        .from('crm_tasks')
        .insert(task)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: CRMTaskUpdate): Promise<CRMTask> {
      const { data, error } = await supabase
        .from('crm_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
};

// ============= CLIENT SEARCHES =============

export const ClientSearches = {
  async list(brokerId?: string) {
    let query = supabase.from('client_searches').select('*').order('created_at', { ascending: false });
    if (brokerId) query = query.eq('broker_id', brokerId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(search: { name: string; filters: any; broker_id?: string; client_id?: string }) {
    const { data, error } = await supabase
      .from('client_searches')
      .insert(search)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('client_searches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('client_searches').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============= SUPPORT TICKETS =============

export const SupportTickets = {
  async list(userId?: string, brokerId?: string) {
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    if (brokerId) query = query.eq('broker_id', brokerId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(ticket: { subject: string; body: string; user_id?: string; broker_id?: string; priority?: string }) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// ============= EXPORT SUPABASE CLIENT =============

export { supabase };