-- Create base tables first (regions, plans, brokers)
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

-- Insert default regions
INSERT INTO public.regions (name, slug, state) VALUES
('Ilhéus', 'ilheus', 'BA'),
('Itabuna', 'itabuna', 'BA'),
('Salvador', 'salvador', 'BA')
ON CONFLICT (slug) DO NOTHING;

-- Insert default plans
INSERT INTO public.plans (name, slug, price, property_limit, match_limit, thread_limit, features) VALUES
('Starter', 'starter', 49.90, 25, 5, 3, '["basic_crm", "property_management"]'),
('Professional', 'professional', 99.90, 100, 20, 10, '["basic_crm", "property_management", "advanced_match", "pdf_contracts", "analytics"]'),
('Premium', 'premium', 199.90, 500, 50, 25, '["basic_crm", "property_management", "advanced_match", "pdf_contracts", "analytics", "ai_assistant", "priority_support"]')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Public can view regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Public can view plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Brokers can view their own profile" ON public.brokers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Brokers can update their own profile" ON public.brokers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Public can view active brokers" ON public.brokers FOR SELECT USING (status = 'active');

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substring(encode(gen_random_bytes(4), 'base64') from 1 for 8));
    code := replace(replace(replace(code, '/', ''), '+', ''), '=', '');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.brokers WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;