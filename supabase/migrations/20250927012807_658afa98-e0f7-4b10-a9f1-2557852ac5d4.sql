-- Fix migration: handle existing primary key and complete schema organization
-- Migration to fix the primary key issue and ensure proper schema setup

-- 1) Normalize names (CRM and Legacy)
DO $$
BEGIN
  -- Rename CRM module tables
  IF to_regclass('public.deals') IS NOT NULL AND to_regclass('public.crm_deals') IS NULL THEN
    ALTER TABLE public.deals RENAME TO crm_deals;
  END IF;

  IF to_regclass('public.conectaios_clients') IS NOT NULL AND to_regclass('public.crm_clients') IS NULL THEN
    ALTER TABLE public.conectaios_clients RENAME TO crm_clients;
  END IF;

  IF to_regclass('public.conectaios_notes') IS NOT NULL AND to_regclass('public.crm_notes') IS NULL THEN
    ALTER TABLE public.conectaios_notes RENAME TO crm_notes;
  END IF;

  IF to_regclass('public.conectaios_tasks') IS NOT NULL AND to_regclass('public.crm_tasks') IS NULL THEN
    ALTER TABLE public.conectaios_tasks RENAME TO crm_tasks;
  END IF;

  -- Isolate potential core duplicates as legacy (no data deletion)
  IF to_regclass('public.conectaios_properties') IS NOT NULL AND to_regclass('public.properties_legacy') IS NULL THEN
    ALTER TABLE public.conectaios_properties RENAME TO properties_legacy;
  END IF;

  IF to_regclass('public.conectaios_brokers') IS NOT NULL AND to_regclass('public.brokers_legacy') IS NULL THEN
    ALTER TABLE public.conectaios_brokers RENAME TO brokers_legacy;
  END IF;
END $$;

-- 2) Fix imovel_features primary key issue
DO $$
BEGIN
  -- Drop existing primary key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'imovel_features_pkey' 
    AND conrelid = 'public.imovel_features'::regclass
  ) THEN
    ALTER TABLE public.imovel_features DROP CONSTRAINT imovel_features_pkey;
  END IF;
  
  -- Ensure key and value columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'imovel_features' 
    AND column_name = 'key'
  ) THEN
    ALTER TABLE public.imovel_features ADD COLUMN key text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'imovel_features' 
    AND column_name = 'value'
  ) THEN
    ALTER TABLE public.imovel_features ADD COLUMN value text;
  END IF;
  
  -- Add new composite primary key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'imovel_features_composite_pk'
  ) THEN
    ALTER TABLE public.imovel_features 
      ADD CONSTRAINT imovel_features_composite_pk PRIMARY KEY (imovel_id, key);
  END IF;
END $$;

-- 3) Complete essential tables setup
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Updated at function
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;

-- Full Text Search function  
CREATE OR REPLACE FUNCTION public.fn_imoveis_set_fts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.norm_title := lower(regexp_replace(coalesce(NEW.title,''),'[^\w\s]+','','g'));
  NEW.search_vector :=
      setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A')
    || setweight(to_tsvector('simple', coalesce(NEW.neighborhood,'')), 'B')
    || setweight(to_tsvector('simple', coalesce(NEW.city,'')), 'C')
    || setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'D');
  RETURN NEW;
END $$;

-- Apply triggers
DROP TRIGGER IF EXISTS tg_imoveis_fts ON public.imoveis;
CREATE TRIGGER tg_imoveis_fts BEFORE INSERT OR UPDATE ON public.imoveis FOR EACH ROW EXECUTE PROCEDURE public.fn_imoveis_set_fts();

DROP TRIGGER IF EXISTS tg_imoveis_updated ON public.imoveis;
CREATE TRIGGER tg_imoveis_updated BEFORE UPDATE ON public.imoveis FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();

-- 4) Advanced search RPC
CREATE OR REPLACE FUNCTION public.search_imoveis(
  q text DEFAULT '',
  city_filter text DEFAULT NULL,
  purpose_filter text DEFAULT NULL,
  limit_rows int DEFAULT 50,
  offset_rows int DEFAULT 0
)
RETURNS SETOF public.imoveis
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM public.imoveis
  WHERE
    (q = '' OR search_vector @@ plainto_tsquery('simple', q))
    AND (city_filter IS NULL OR city = city_filter)
    AND (purpose_filter IS NULL OR purpose = purpose_filter)
  ORDER BY
    ts_rank(search_vector, plainto_tsquery('simple', q)) DESC NULLS LAST,
    created_at DESC
  LIMIT limit_rows OFFSET offset_rows;
$$;

-- 5) Storage bucket setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('imoveis','imoveis', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS storage_public_read_imoveis ON storage.objects;
CREATE POLICY storage_public_read_imoveis
ON storage.objects FOR SELECT
USING (bucket_id = 'imoveis' AND position('public/' IN name) = 1);

DROP POLICY IF EXISTS storage_auth_write_imoveis ON storage.objects;
CREATE POLICY storage_auth_write_imoveis
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'imoveis' AND auth.role() = 'authenticated');