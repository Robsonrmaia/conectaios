// Compatibility types for legacy code
export interface PropertyRow {
  id: string;
  title: string | null;
  titulo?: string | null; // alias legado
  description: string | null;
  descricao?: string | null; // alias legado
  purpose: string | null;
  price: number | null;
  valor?: number | null; // alias legado
  city: string | null;
  cidade?: string | null; // alias legado
  neighborhood: string | null;
  bairro?: string | null; // alias legado
  is_public: boolean | null;
  visibility: string | null;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  thumb_url: string | null;
  type?: string | null;
  status?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_total?: number | null;
  area_built?: number | null;
}

// Plan interface for useBroker
export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  property_limit: number;
  features: any;
  is_active: boolean;
  match_limit: number;
  thread_limit: number;
  created_at: string;
  updated_at: string;
}

// Chat interfaces
export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  reply_to_id: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
  edited_at?: string | null; // Campo opcional para compatibilidade
  sender_name?: string;
  sender_avatar?: string;
}

// Indication interfaces
export interface Indication {
  id: string;
  id_indicador?: string; // alias para referrer_id
  id_indicado?: string; // alias para referred_id
  referrer_id: string;
  referred_id: string | null;
  referred_email: string | null;
  referred_phone: string | null;
  status: string;
  reward_amount: number;
  reward_claimed: boolean;
  mes_recompensa?: string;
  data_criacao?: string;
  created_at: string;
  updated_at: string;
  indicador?: any;
  indicado?: any;
}

export interface IndicationDiscount {
  id: string;
  indication_id: string;
  discount_percentage: number;
  valor_desconto?: number; // alias
  valor_original?: number; // alias
  used: boolean;
  valid_until: string | null;
  created_at: string;
}

// Support Ticket interface
export interface SupportTicket {
  id: string;
  user_id: string;
  broker_id: string | null;
  assignee_id: string | null;
  title?: string;
  subject: string;
  body: string;
  description?: string | null;
  category?: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  titulo: string;
  valor: number;
  // adicione outros campos conforme necessário
}

export interface ClientHistory {
  id: string;
  client_id: string;
  action: string;
  description: string;
  created_at: string;
  user_id: string;
}

// Update MarketStat interface to match returned data
export interface MarketStat {
  id: string;
  period_start: string;
  period_end: string;
  property_type: string;
  listing_type: string;
  avg_price: number;
  total_listings: number;
  avg_days_on_market: number;
  price_per_sqm: number;
  region: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerRow {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  creci: string | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  status: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  referral_code: string | null;
  cpf_cnpj: string | null;
  plan_id: string | null;
  region_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PartnerRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  active: boolean;
  category?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export interface TestimonialRow {
  id: string;
  user_id: string | null;
  name?: string;
  testimonial?: string;
  author_name?: string;
  content?: string;
  rating: number;
  published?: boolean;
  is_active?: boolean;
  sort_order?: number;
  source?: string;
  created_at: string;
  updated_at: string;
}

// Adicionar Client com campo classificacao
export interface Client {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  tipo: string;
  stage: string;
  valor?: number;
  score: number;
  historico: any;
  classificacao: string; // campo esperado pelos componentes
  created_at: string;
  updated_at: string;
  user_id?: string;
  broker_id?: string;
}

// Export types for compatibility
export type { Database } from '@/integrations/supabase/types';