// Compatibility types for legacy code
export interface PropertyRow {
  id: string;
  title: string | null;
  description: string | null;
  purpose: string | null;
  price: number | null;
  city: string | null;
  neighborhood: string | null;
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