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

// Enhanced property type with all expected fields
export interface PropertyCompat {
  id: string;
  title: string;
  titulo: string; // legacy alias
  description: string | null;
  descricao: string | null; // legacy alias
  price: number | null;
  valor: number | null; // legacy alias
  city: string | null;
  cidade: string | null; // legacy alias
  neighborhood: string | null;
  bairro: string | null; // legacy alias
  purpose: string | null;
  status: string | null;
  owner_id: string;
  user_id: string; // alias for legacy code
  quartos: number | null;
  banheiros: number | null;
  suites: number | null;
  vagas: number | null;
  area_total: number | null;
  area_privativa: number | null;
  area: number | null;
  address: string | null;
  state: string | null;
  verified: boolean;
  match_count: number;
  is_public: boolean;
  visibility: string | null;
  created_at: string;
  updated_at: string;
  thumb_url: string | null;
}