-- FASE 1: Criar novas tabelas conectaios_ com RLS e funções adequadas

-- Criar conectaios_profiles
CREATE TABLE public.conectaios_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

ALTER TABLE public.conectaios_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile" ON public.conectaios_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Criar conectaios_plans  
CREATE TABLE public.conectaios_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price NUMERIC NOT NULL DEFAULT 0,
  property_limit INTEGER NOT NULL DEFAULT 50,
  match_limit INTEGER NOT NULL DEFAULT 10,
  thread_limit INTEGER NOT NULL DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL
);

ALTER TABLE public.conectaios_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view plans" ON public.conectaios_plans
  FOR SELECT USING (true);

-- Criar conectaios_brokers
CREATE TABLE public.conectaios_brokers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  region_id UUID,
  plan_id UUID,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  creci TEXT,
  username TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  subscription_status TEXT DEFAULT 'trial',
  asaas_customer_id TEXT,
  referral_code TEXT
);

ALTER TABLE public.conectaios_brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view their own profile" ON public.conectaios_brokers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Brokers can update their own profile" ON public.conectaios_brokers  
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Public can view minimal broker info for mini sites" ON public.conectaios_brokers
  FOR SELECT USING (status = 'active' AND (auth.uid() IS NULL OR auth.uid() <> user_id));

-- Migrar dados existentes
INSERT INTO conectaios_profiles (id, user_id, created_at, updated_at, nome, role)
SELECT id, user_id, created_at, updated_at, nome, role FROM profiles;

INSERT INTO conectaios_plans (id, price, property_limit, match_limit, thread_limit, features, is_active, created_at, updated_at, name, slug)
SELECT id, price, property_limit, match_limit, thread_limit, features, is_active, created_at, updated_at, name, slug FROM plans;

INSERT INTO conectaios_brokers (id, user_id, region_id, plan_id, subscription_expires_at, created_at, updated_at, name, email, phone, creci, username, bio, avatar_url, cover_url, status, subscription_status, asaas_customer_id, referral_code)
SELECT id, user_id, region_id, plan_id, subscription_expires_at, created_at, updated_at, name, email, phone, creci, username, bio, avatar_url, cover_url, status, subscription_status, asaas_customer_id, referral_code FROM brokers;