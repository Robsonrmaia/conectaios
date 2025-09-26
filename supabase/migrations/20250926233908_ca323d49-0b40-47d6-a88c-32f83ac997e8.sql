-- ==========================================
-- MIGRAÇÃO SIMPLES E SEGURA
-- ==========================================

-- Extensões básicas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- VERIFICAR E CRIAR TABELAS ESSENCIAIS
-- ==========================================

-- Criar tabela properties se não existe (estrutura mínima compatível)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
    CREATE TABLE public.properties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      valor NUMERIC,
      area NUMERIC,
      quartos INTEGER DEFAULT 0,
      banheiros INTEGER DEFAULT 0,
      property_type TEXT NOT NULL DEFAULT 'apartamento',
      listing_type TEXT NOT NULL DEFAULT 'venda',
      status TEXT NOT NULL DEFAULT 'ATIVO',
      address TEXT,
      neighborhood TEXT,
      city TEXT NOT NULL,
      state TEXT DEFAULT 'BA',
      fotos TEXT[] DEFAULT '{}',
      is_public BOOLEAN DEFAULT true,
      visibility TEXT DEFAULT 'public_site',
      slug TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Criar tabela conectaios_brokers se não existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conectaios_brokers') THEN
    CREATE TABLE public.conectaios_brokers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      username TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Criar tabela profiles se não existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- ==========================================
-- ADICIONAR COLUNAS SE NÃO EXISTEM
-- ==========================================

-- Adicionar colunas extras à properties
DO $$ 
BEGIN
  -- Adicionar colunas que podem não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'suites') THEN
    ALTER TABLE public.properties ADD COLUMN suites INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'vagas') THEN
    ALTER TABLE public.properties ADD COLUMN vagas INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'cep') THEN
    ALTER TABLE public.properties ADD COLUMN cep TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'tour_360_url') THEN
    ALTER TABLE public.properties ADD COLUMN tour_360_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'video_url') THEN
    ALTER TABLE public.properties ADD COLUMN video_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'featured') THEN
    ALTER TABLE public.properties ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'views_count') THEN
    ALTER TABLE public.properties ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'iptu_mensal') THEN
    ALTER TABLE public.properties ADD COLUMN iptu_mensal NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'condominio_mensal') THEN
    ALTER TABLE public.properties ADD COLUMN condominio_mensal NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'reference_code') THEN
    ALTER TABLE public.properties ADD COLUMN reference_code TEXT UNIQUE;
  END IF;
END $$;

-- Adicionar colunas extras aos brokers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conectaios_brokers' AND column_name = 'phone') THEN
    ALTER TABLE public.conectaios_brokers ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conectaios_brokers' AND column_name = 'bio') THEN
    ALTER TABLE public.conectaios_brokers ADD COLUMN bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conectaios_brokers' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.conectaios_brokers ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conectaios_brokers' AND column_name = 'cover_url') THEN
    ALTER TABLE public.conectaios_brokers ADD COLUMN cover_url TEXT;
  END IF;
END $$;

-- ==========================================
-- FUNÇÕES BÁSICAS
-- ==========================================

-- Função para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS BÁSICOS
-- ==========================================

-- Trigger para properties
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para brokers  
DROP TRIGGER IF EXISTS update_brokers_updated_at ON public.conectaios_brokers;
CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON public.conectaios_brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Ativar RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conectaios_brokers ENABLE ROW LEVEL SECURITY;

-- Política básica para properties
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;
CREATE POLICY "Users can manage own properties" ON public.properties
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view published properties" ON public.properties;
CREATE POLICY "Public can view published properties" ON public.properties
  FOR SELECT USING (
    is_public = true 
    AND COALESCE(visibility, 'public_site') IN ('public_site', 'both') 
    AND COALESCE(status, 'ATIVO') = 'ATIVO'
  );

-- Política básica para brokers
DROP POLICY IF EXISTS "Brokers can manage own profile" ON public.conectaios_brokers;
CREATE POLICY "Brokers can manage own profile" ON public.conectaios_brokers
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view active brokers" ON public.conectaios_brokers;
CREATE POLICY "Public can view active brokers" ON public.conectaios_brokers
  FOR SELECT USING (COALESCE(status, 'active') = 'active');

-- ==========================================
-- STORAGE
-- ==========================================

-- Criar bucket se não existe
INSERT INTO storage.buckets (id, name, public) 
SELECT 'property-images', 'property-images', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-images');

-- Política para storage
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.uid() IS NOT NULL
  );

-- ==========================================
-- MIGRAÇÃO BÁSICA CONCLUÍDA
-- ==========================================