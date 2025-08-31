-- ========================================
-- CONECTA IOS - Database Schema Completo
-- ========================================

-- 1. Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  property_limit INTEGER NOT NULL DEFAULT 50,
  match_limit INTEGER NOT NULL DEFAULT 10,
  thread_limit INTEGER NOT NULL DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create brokers table (enhanced profiles)
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  region_id UUID REFERENCES public.regions(id),
  plan_id UUID REFERENCES public.plans(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  creci TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'canceled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  asaas_customer_id TEXT,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enhance properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zipcode TEXT,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parking_spots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartamento',
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'venda' CHECK (listing_type IN ('venda', 'locacao')),
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public_site' CHECK (visibility IN ('hidden', 'match_only', 'public_site')),
ADD COLUMN IF NOT EXISTS price_per_m2 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS condominium_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS iptu DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coordinates JSONB;

-- Remove old columns that conflict
ALTER TABLE public.properties 
DROP COLUMN IF EXISTS finalidade,
DROP COLUMN IF EXISTS is_public,
DROP COLUMN IF EXISTS broker_minisite_enabled;

-- 5. Create deals table (negotiations)
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  buyer_broker_id UUID NOT NULL REFERENCES public.brokers(id),
  seller_broker_id UUID REFERENCES public.brokers(id),
  listing_broker_id UUID REFERENCES public.brokers(id),
  status TEXT NOT NULL DEFAULT 'proposta' CHECK (status IN ('proposta', 'negociacao', 'aceita', 'rejeitada', 'finalizada', 'cancelada')),
  offer_amount DECIMAL(12,2) NOT NULL,
  commission_split JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create deal_history table (counter-offers)
CREATE TABLE IF NOT EXISTS public.deal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.brokers(id),
  action TEXT NOT NULL CHECK (action IN ('offer', 'counter_offer', 'accept', 'reject', 'message')),
  amount DECIMAL(12,2),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create threads table (chat)
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'deal' CHECK (type IN ('deal', 'general', 'support')),
  participants UUID[] NOT NULL DEFAULT '{}',
  title TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Update messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.brokers(id),
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- 9. Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL DEFAULT 'compra_venda',
  contract_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'signed')),
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Create client_preferences table
CREATE TABLE IF NOT EXISTS public.client_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_type TEXT[],
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  min_area DECIMAL(10,2),
  max_area DECIMAL(10,2),
  bedrooms INTEGER[],
  bathrooms INTEGER[],
  parking_spots INTEGER[],
  neighborhoods TEXT[],
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Create plan_tools table
CREATE TABLE IF NOT EXISTS public.plan_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  daily_limit INTEGER,
  monthly_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, tool_name)
);

-- 12. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.brokers(id),
  referred_id UUID REFERENCES public.brokers(id),
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
  commission_amount DECIMAL(10,2),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Create content tables
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO public.plans (name, slug, price, property_limit, match_limit, thread_limit, features) VALUES
('Starter', 'starter', 49.90, 25, 5, 3, '["basic_crm", "property_management"]'),
('Professional', 'professional', 99.90, 100, 20, 10, '["basic_crm", "property_management", "advanced_match", "pdf_contracts", "analytics"]'),
('Premium', 'premium', 199.90, 500, 50, 25, '["basic_crm", "property_management", "advanced_match", "pdf_contracts", "analytics", "ai_assistant", "priority_support"]')
ON CONFLICT (slug) DO NOTHING;

-- Insert default regions
INSERT INTO public.regions (name, slug, state) VALUES
('Ilhéus', 'ilheus', 'BA'),
('Itabuna', 'itabuna', 'BA'),
('Salvador', 'salvador', 'BA')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Regions (public read)
CREATE POLICY "Public can view regions" ON public.regions FOR SELECT USING (true);

-- Plans (public read)
CREATE POLICY "Public can view plans" ON public.plans FOR SELECT USING (true);

-- Brokers policies
CREATE POLICY "Brokers can view their own profile" ON public.brokers 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Brokers can update their own profile" ON public.brokers 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Public can view active brokers" ON public.brokers 
FOR SELECT USING (status = 'active');

-- Deals policies
CREATE POLICY "Brokers can manage their deals" ON public.deals 
FOR ALL USING (
  buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Deal history policies
CREATE POLICY "Brokers can view deal history they participate in" ON public.deal_history 
FOR SELECT USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE 
    buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Brokers can insert deal history" ON public.deal_history 
FOR INSERT WITH CHECK (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Threads policies
CREATE POLICY "Brokers can access threads they participate in" ON public.threads 
FOR ALL USING (
  (SELECT id FROM public.brokers WHERE user_id = auth.uid()) = ANY(participants)
);

-- Client preferences policies
CREATE POLICY "Brokers can manage client preferences" ON public.client_preferences 
FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

-- Content policies (admin managed)
CREATE POLICY "Public can view banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Public can view partnerships" ON public.partnerships FOR SELECT USING (is_active = true);

-- Contracts policies
CREATE POLICY "Brokers can manage contracts for their deals" ON public.contracts 
FOR ALL USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE 
    buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  )
);

-- Referrals policies
CREATE POLICY "Brokers can manage their referrals" ON public.referrals 
FOR ALL USING (
  referrer_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  referred_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Plan tools policies
CREATE POLICY "Public can view plan tools" ON public.plan_tools FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON public.brokers(user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_username ON public.brokers(username);
CREATE INDEX IF NOT EXISTS idx_brokers_region ON public.brokers(region_id);
CREATE INDEX IF NOT EXISTS idx_properties_region ON public.properties(region_id);
CREATE INDEX IF NOT EXISTS idx_properties_visibility ON public.properties(visibility);
CREATE INDEX IF NOT EXISTS idx_deals_property ON public.deals(property_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_broker ON public.deals(buyer_broker_id);
CREATE INDEX IF NOT EXISTS idx_threads_participants ON public.threads USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id);

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substring(encode(gen_random_bytes(4), 'base64') from 1 for 8));
    -- Replace problematic characters
    code := replace(replace(replace(code, '/', ''), '+', ''), '=', '');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.brokers WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;