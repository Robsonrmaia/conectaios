import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// FASE 3: Camada de dados unificada para todas as ferramentas

// Types para compatibilidade
type Imovel = Database['public']['Tables']['imoveis']['Row'];
type ImovelInsert = Database['public']['Tables']['imoveis']['Insert'];
type ImovelUpdate = Database['public']['Tables']['imoveis']['Update'];

type CRMClient = Database['public']['Tables']['crm_clients']['Row'];
type CRMDeal = Database['public']['Tables']['crm_deals']['Row'];
type CRMNote = Database['public']['Tables']['crm_notes']['Row'];
type CRMTask = Database['public']['Tables']['crm_tasks']['Row'];
type Broker = Database['public']['Tables']['brokers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Lead = Database['public']['Tables']['leads']['Row'];

// Extended types for joined queries
export interface BrokerWithProfile extends Broker {
  profile?: Profile;
}

export interface CRMClientExtended extends CRMClient {
  broker?: Broker;
}

export interface CRMDealExtended extends CRMDeal {
  client?: CRMClient;
  property?: Imovel;
}

// Legacy compatibility types (para componentes antigos)
export interface Property {
  id: string;
  titulo: string;
  valor: number;
  descricao?: string;
  cidade?: string;
  bairro?: string;
  tipo?: string;
  finalidade?: string;
}

export interface Client {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  broker_id?: string;
}

export interface Deal {
  id: string;
  client_id: string;
  property_id?: string;
  amount?: number;
  stage?: string;
  created_at?: string;
}

export function imovelToProperty(imovel: Imovel): Property {
  return {
    id: imovel.id,
    titulo: imovel.title,
    valor: Number(imovel.price) || 0,
    descricao: imovel.description || '',
    cidade: imovel.city || '',
    bairro: imovel.neighborhood || '',
    tipo: imovel.type || '',
    finalidade: imovel.purpose
  };
}

export function crmClientToClient(client: CRMClient): Client {
  return {
    id: client.id,
    nome: client.name,
    email: client.email || '',
    telefone: client.phone || '',
    broker_id: client.broker_id || ''
  };
}

export function crmDealToDeal(deal: CRMDeal): Deal {
  return {
    id: deal.id,
    client_id: deal.client_id || '',
    property_id: deal.property_id || '',
    amount: Number(deal.offer_amount) || 0,
    stage: deal.status || '',
    created_at: deal.created_at || ''
  };
}

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
  // Brokers
  brokers: {
    async list(): Promise<Broker[]> {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Broker[];
    },

    async listWithProfiles(): Promise<BrokerWithProfile[]> {
      const { data, error } = await supabase
        .from('brokers')
        .select(`*, profiles(*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BrokerWithProfile[];
    },

    async create(brokerData: Omit<Broker, 'id' | 'created_at' | 'updated_at'>): Promise<Broker> {
      const { data, error } = await supabase
        .from('brokers')
        .insert(brokerData)
        .select()
        .single();
      if (error) throw error;
      return data as Broker;
    },

    async insert(brokerData: any): Promise<{ error: any }> {
      const { error } = await supabase
        .from('brokers')
        .insert(brokerData);
      return { error };
    }
  },

  // Profiles
  profiles: {
    async updateRole(userId: string, role: 'admin' | 'broker' | 'user') {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Clients
  clients: {
    async list(): Promise<CRMClient[]> {
      const { data, error } = await supabase
        .from('crm_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMClient[];
    },

    async create(client: Omit<CRMClient, 'id' | 'created_at' | 'updated_at'>): Promise<CRMClient> {
      const { data, error } = await supabase
        .from('crm_clients')
        .insert(client)
        .select()
        .single();

      if (error) throw error;
      return data as CRMClient;
    },

    async update(id: string, updates: Partial<CRMClient>): Promise<CRMClient> {
      const { data, error } = await supabase
        .from('crm_clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CRMClient;
    },

    // Compatibility methods for legacy components
    async listAsLegacy(): Promise<Client[]> {
      const clients = await this.list();
      return clients.map(crmClientToClient);
    }
  },

  // Deals
  deals: {
    async list(): Promise<CRMDealExtended[]> {
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          crm_clients(name, email),
          imoveis(title, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMDealExtended[];
    },

    async create(deal: Omit<CRMDeal, 'id' | 'created_at' | 'updated_at'>): Promise<CRMDeal> {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert(deal)
        .select()
        .single();

      if (error) throw error;
      return data as CRMDeal;
    },

    // Compatibility methods for legacy components
    async listAsLegacy(): Promise<Deal[]> {
      const deals = await this.list();
      return deals.map(crmDealToDeal);
    }
  },

  // Notes
  notes: {
    async list(): Promise<CRMNote[]> {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMNote[];
    },

    async create(note: Omit<CRMNote, 'id' | 'created_at' | 'updated_at'>): Promise<CRMNote> {
      const { data, error } = await supabase
        .from('crm_notes')
        .insert(note)
        .select()
        .single();

      if (error) throw error;
      return data as CRMNote;
    }
  },

  // Tasks
  tasks: {
    async list(): Promise<CRMTask[]> {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as CRMTask[];
    },

    async create(task: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>): Promise<CRMTask> {
      const { data, error } = await supabase
        .from('crm_tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data as CRMTask;
    },

    async update(id: string, updates: Partial<CRMTask>): Promise<CRMTask> {
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

// Export all data access objects and types
export { 
  Properties, 
  CRM,
  supabase 
};

// Export types for components
export type { 
  Imovel, 
  ImovelInsert, 
  ImovelUpdate,
  CRMClient, 
  CRMDeal, 
  CRMNote, 
  CRMTask,
  BrokerWithProfile, 
  CRMClientExtended, 
  CRMDealExtended,
  Property, 
  Client, 
  Deal 
};

// Client Searches functionality
export const ClientSearches = {
  async list(brokerId?: string) {
    const query = supabase.from('client_searches').select('*').order('created_at', { ascending: false });
    if (brokerId) query.eq('broker_id', brokerId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(search: { name: string; filters: any; broker_id?: string }) {
    const { data, error } = await supabase.from('client_searches').insert(search).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('client_searches').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('client_searches').delete().eq('id', id);
    if (error) throw error;
  }
};

// Support Tickets functionality  
export const SupportTickets = {
  async list(userId?: string) {
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(ticket: { subject: string; body: string; user_id?: string; priority?: string }) {
    const { data, error } = await supabase.from('support_tickets').insert(ticket).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase.from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};

// Enhanced Properties with search functionality
const EnhancedProperties = {
  ...Properties,
  
  async search(params: { query?: string; city?: string; purpose?: string; limit?: number } = {}) {
    const { data, error } = await supabase.rpc('search_imoveis', {
      q: params.query || '',
      city_filter: params.city || null,
      purpose_filter: params.purpose || null,
      limit_rows: params.limit || 50,
      offset_rows: 0
    });
    if (error) throw error;
    return data || [];
  },

  async findMatches(brokerId: string, filters: any = {}) {
    const { data, error } = await supabase.rpc('find_property_matches', {
      p_broker_id: brokerId,
      p_filters: filters,
      p_limit: 50,
      p_offset: 0
    });
    if (error) throw error;
    return data || [];
  },

  async findIntelligentMatches(query: string = '', city: string | null = null) {
    const { data, error } = await supabase.rpc('find_intelligent_property_matches', {
      p_query: query,
      p_city: city,
      p_limit: 50,
      p_offset: 0
    });
    if (error) throw error;
    return data || [];
  }
};

// Override Properties export
export { EnhancedProperties as Properties };