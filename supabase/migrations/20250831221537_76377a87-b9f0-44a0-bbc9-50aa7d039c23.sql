-- FASE 2: Criar tabelas restantes com migração de dados específica

-- Deletar tabelas criadas anteriormente que falharam
DROP TABLE IF EXISTS conectaios_properties CASCADE;
DROP TABLE IF EXISTS conectaios_clients CASCADE;  
DROP TABLE IF EXISTS conectaios_deals CASCADE;

-- Criar conectaios_properties com estrutura exata
CREATE TABLE public.conectaios_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  titulo TEXT NOT NULL,
  finalidade TEXT,
  quartos INTEGER DEFAULT 0,
  valor NUMERIC DEFAULT 0,
  area NUMERIC DEFAULT 0,
  descricao TEXT,
  fotos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT true,
  broker_minisite_enabled BOOLEAN DEFAULT false,
  bathrooms INTEGER DEFAULT 0,
  parking_spots INTEGER DEFAULT 0,
  listing_type TEXT DEFAULT 'venda',
  property_type TEXT DEFAULT 'apartamento',
  visibility TEXT DEFAULT 'public_site',
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  price_per_m2 NUMERIC,
  condominium_fee NUMERIC,
  iptu NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,
  coordinates JSONB,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  reference_code TEXT
);

ALTER TABLE public.conectaios_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own properties" ON public.conectaios_properties
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view approved properties only" ON public.conectaios_properties
  FOR SELECT USING (is_public = true AND visibility IN ('public_site', 'match_only') AND user_id IS NOT NULL);

-- Migrar dados de properties específicamente
INSERT INTO conectaios_properties (
  id, user_id, titulo, finalidade, quartos, valor, area, descricao, fotos, videos,
  created_at, updated_at, is_public, broker_minisite_enabled, bathrooms, parking_spots,
  listing_type, property_type, visibility, address, neighborhood, city, state, zipcode,
  price_per_m2, condominium_fee, iptu, features, coordinates, is_featured, views_count,
  last_viewed_at, reference_code
)
SELECT 
  id, user_id, titulo, finalidade, quartos, valor, area, descricao, fotos, videos,
  created_at, updated_at, is_public, broker_minisite_enabled, bathrooms, parking_spots,
  listing_type, property_type, visibility, address, neighborhood, city, state, zipcode,
  price_per_m2, condominium_fee, iptu, features, coordinates, is_featured, views_count,
  last_viewed_at, reference_code
FROM properties;