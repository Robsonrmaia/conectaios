-- ===== CONECTAIOS SAAS SCHEMA COMPLETO - PARTE 1 =====
-- Implementação completa baseada no prompt fornecido

-- 1) Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2) Criar enum e adicionar coluna role na tabela profiles
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin','broker','user');

-- Adicionar coluna role se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'broker'::user_role;

-- 3) Criar nova tabela brokers (substituirá conectaios_brokers)
CREATE TABLE IF NOT EXISTS public.brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creci text,
  minisite_slug text UNIQUE,
  whatsapp text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brokers_user ON public.brokers(user_id);

-- 4) Criar tabela imoveis (substituirá conectaios_properties)  
CREATE TABLE IF NOT EXISTS public.imoveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('house','apartment','land','room','commercial')) DEFAULT 'house',
  purpose text CHECK (purpose IN ('sale','rent','season')) NOT NULL,
  price numeric(14,2),
  condo_fee numeric(14,2),
  status text CHECK (status IN ('available','reserved','sold','rented')) DEFAULT 'available',
  is_furnished boolean DEFAULT false,
  -- endereço básico
  city text,
  state text,
  neighborhood text,
  street text,
  number text,
  zipcode text,
  -- métricas
  area_total numeric(10,2),
  area_built numeric(10,2),
  bedrooms int,
  bathrooms int,
  suites int,
  parking int,
  -- visibilidade
  is_public boolean DEFAULT false,
  visibility text CHECK (visibility IN ('public_site','private','partners')) DEFAULT 'private',
  -- busca
  norm_title text,
  search_vector tsvector,
  -- temporal
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imoveis_owner ON public.imoveis(owner_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_city ON public.imoveis(city);
CREATE INDEX IF NOT EXISTS idx_imoveis_visibility ON public.imoveis(visibility);
CREATE INDEX IF NOT EXISTS idx_imoveis_is_public ON public.imoveis(is_public);
CREATE INDEX IF NOT EXISTS idx_imoveis_status ON public.imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_fts ON public.imoveis USING gin(search_vector);

-- 5) Imagens dos imóveis
CREATE TABLE IF NOT EXISTS public.imovel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  position int DEFAULT 0,
  is_cover boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_images_imovel ON public.imovel_images(imovel_id);
CREATE INDEX IF NOT EXISTS idx_images_cover ON public.imovel_images(imovel_id, is_cover);

-- 6) Features chave-valor
CREATE TABLE IF NOT EXISTS public.imovel_features (
  imovel_id uuid NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  PRIMARY KEY (imovel_id, key)
);

-- 7) Minisites por corretor
CREATE TABLE IF NOT EXISTS public.minisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text,
  subtitle text,
  about_md text,
  theme jsonb,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_minisites_owner ON public.minisites(owner_id);