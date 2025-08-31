-- Complete the database schema with remaining tables

-- 1. Create deals table (negotiations)
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

-- 2. Create deal_history table (counter-offers)
CREATE TABLE IF NOT EXISTS public.deal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.brokers(id),
  action TEXT NOT NULL CHECK (action IN ('offer', 'counter_offer', 'accept', 'reject', 'message')),
  amount DECIMAL(12,2),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create threads table (chat)
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

-- 4. Create contracts table
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

-- 5. Create client_preferences table
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

-- 6. Create plan_tools table
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

-- 7. Create referrals table
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

-- 8. Create content tables
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

-- Enable RLS on all new tables
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

-- Add triggers for updated_at columns
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_preferences_updated_at
  BEFORE UPDATE ON public.client_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();