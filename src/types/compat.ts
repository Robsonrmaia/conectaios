// Tipos mínimos usados na UI. NÃO é o schema completo.
// Ajuste só se um erro apontar campo ausente.

export type PropertyCompat = {
  id: string;
  title: string;
  description?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  price?: number | null;
  purpose?: string | null;
  is_public?: boolean | null;
  visibility?: string | null;
  created_at?: string;
  owner_id?: string;
  thumb_url?: string | null;
  // Campos legados
  titulo?: string | null;
  valor?: number | null;
  descricao?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  // Campos adicionais da view
  bathrooms?: number | null;
  parking_spots?: number | null;
  parking?: number | null;
  raw_cnm?: any;
  raw_vrsync?: any;
  listing_type?: string | null;
  property_type?: string | null;
  fotos?: string[] | null;
  area?: number | null;
  quartos?: number | null;
  condominium_fee?: number | null;
  iptu?: number | null;
  zipcode?: string | null;
  distancia_mar?: number | null;
  has_sea_view?: boolean | null;
  banner_type?: string | null;
  furnishing_type?: string | null;
  videos?: string[] | null;
  sea_distance?: number | null;
};

export type PropertyImageCompat = {
  id: string;
  property_id?: string;
  imovel_id?: string;
  url: string;
  storage_path?: string | null;
  is_cover?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type BrokerCompat = {
  id: string;
  user_id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  creci?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  status?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  referral_code?: string | null;
  cpf_cnpj?: string | null;
  plan_id?: string | null;
  region_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileCompat = {
  id: string;
  user_id?: string; // Compatibilidade - mesmo que id
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
  nome?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  role?: 'admin' | 'broker' | 'user' | null;
  created_at?: string;
  updated_at?: string;
};

export type ClientCompat = {
  id: string;
  broker_id?: string | null;
  user_id?: string | null;
  nome?: string | null;
  name?: string | null;
  email?: string | null;
  telefone?: string | null;
  phone?: string | null;
  tipo?: string | null;
  stage?: string | null;
  valor?: number | null;
  score?: number | null;
  historico?: any;
  classificacao?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DealCompat = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  user_id?: string | null;
  status?: string | null;
  offer_amount?: number | null;
  commission_amount?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ChatMessageCompat = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  reply_to_id?: string | null;
  sender_name?: string | null;
  sender_avatar?: string | null;
  edited_at?: string | null; // Campo obrigatório
};

export type IndicationCompat = {
  id: string;
  referrer_id?: string | null;
  referred_id?: string | null;
  referred_email?: string | null;
  referred_phone?: string | null;
  status?: string | null;
  reward_amount?: number | null;
  reward_claimed?: boolean | null;
  created_at?: string;
  updated_at?: string;
  // Campos de compatibilidade legados
  id_indicador?: string | null;
  id_indicado?: string | null;
  mes_recompensa?: string | null;
  data_criacao?: string | null;
  valor_desconto?: number | null;
  valor_original?: number | null;
  // Campos usados pela UI
  indicador?: any;
  indicado?: any;
  codigo_indicacao?: string | null;
  data_confirmacao?: string | null;
  desconto_aplicado?: number | null;
  [key: string]: any;
};

export type UserCompat = {
  id: string;
  user_id?: string; // Compatibilidade - mesmo que id
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
  nome?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  role?: 'admin' | 'broker' | 'user' | null;
  created_at?: string;
  updated_at?: string;
};

// Tipos globais para compatibilidade
declare global {
  type CompatIndication = IndicationCompat;
  function compatIndication(data: any): CompatIndication;
}