-- FASE 2: Criar tabelas principais de negócio

-- Criar conectaios_properties
CREATE TABLE public.conectaios_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  quartos INTEGER DEFAULT 0,
  valor NUMERIC DEFAULT 0,
  area NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT true,
  broker_minisite_enabled BOOLEAN DEFAULT false,
  bathrooms INTEGER DEFAULT 0,
  parking_spots INTEGER DEFAULT 0,
  price_per_m2 NUMERIC,
  condominium_fee NUMERIC,
  iptu NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,
  coordinates JSONB,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  titulo TEXT NOT NULL,
  finalidade TEXT,
  descricao TEXT,
  fotos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  listing_type TEXT DEFAULT 'venda',
  property_type TEXT DEFAULT 'apartamento',
  visibility TEXT DEFAULT 'public_site',
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  reference_code TEXT
);

ALTER TABLE public.conectaios_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own properties" ON public.conectaios_properties
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view approved properties only" ON public.conectaios_properties
  FOR SELECT USING (is_public = true AND visibility IN ('public_site', 'match_only') AND user_id IS NOT NULL);

-- Criar conectaios_clients
CREATE TABLE public.conectaios_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  historico JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responsavel UUID,
  valor NUMERIC,
  pipeline_id UUID,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo TEXT NOT NULL,
  photo TEXT,
  opp TEXT,
  documents TEXT[],
  classificacao TEXT DEFAULT 'novo_lead',
  stage TEXT DEFAULT 'novo_lead'
);

ALTER TABLE public.conectaios_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own clients" ON public.conectaios_clients
  FOR ALL USING (auth.uid() = user_id);

-- Criar conectaios_deals
CREATE TABLE public.conectaios_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  client_id UUID,
  buyer_broker_id UUID NOT NULL,
  seller_broker_id UUID,
  listing_broker_id UUID,
  offer_amount NUMERIC NOT NULL,
  commission_split JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'proposta'
);

ALTER TABLE public.conectaios_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can manage their deals" ON public.conectaios_deals
  FOR ALL USING (
    buyer_broker_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid()) OR
    seller_broker_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid()) OR
    listing_broker_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
  );

-- Migrar dados das tabelas existentes
INSERT INTO conectaios_properties SELECT * FROM properties;
INSERT INTO conectaios_clients SELECT * FROM clients;
INSERT INTO conectaios_deals SELECT * FROM deals;