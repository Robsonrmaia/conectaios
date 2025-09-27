-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Remover qualquer dependência de conectaios_brokers e garantir uso de brokers
DO $$
BEGIN
  -- property_submissions: policy deve usar public.brokers
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_submissions' AND policyname='property_submissions_broker_access') THEN
    DROP POLICY property_submissions_broker_access ON public.property_submissions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='property_submissions' AND policyname='property_submissions_broker_rw') THEN
    CREATE POLICY property_submissions_broker_rw ON public.property_submissions
    FOR ALL
    USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
    WITH CHECK (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Drop/arquivar a tabela antiga se ainda existir
DO $$
DECLARE cnt bigint;
BEGIN
  IF to_regclass('public.conectaios_brokers') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.conectaios_brokers' INTO cnt;
    IF cnt = 0 THEN
      EXECUTE 'DROP TABLE public.conectaios_brokers';
    ELSE
      -- manter só como legado (sem nenhuma policy ativa apontando pra ela)
      IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='brokers_legacy') THEN
        EXECUTE 'ALTER TABLE public.conectaios_brokers RENAME TO brokers_legacy';
      END IF;
    END IF;
  END IF;
END $$;

-- 3. Tabelas faltantes: client_searches e support_tickets
CREATE TABLE IF NOT EXISTS public.client_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.crm_clients(id) ON DELETE SET NULL,
  broker_id uuid REFERENCES public.brokers(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Busca salva',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broker_id, name)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  broker_id uuid REFERENCES public.brokers(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',   -- open|in_progress|closed
  priority text NOT NULL DEFAULT 'normal', -- low|normal|high
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS mínimo para as novas tabelas
ALTER TABLE public.client_searches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_searches' AND policyname='client_searches_broker_rw') THEN
    CREATE POLICY client_searches_broker_rw ON public.client_searches
    FOR ALL
    USING (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
    WITH CHECK (broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='support_tickets' AND policyname='support_tickets_owner_rw') THEN
    CREATE POLICY support_tickets_owner_rw ON public.support_tickets
    FOR ALL
    USING (user_id = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()))
    WITH CHECK (user_id = auth.uid() OR broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- 5. Índices úteis
CREATE INDEX IF NOT EXISTS idx_client_searches_broker ON public.client_searches(broker_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_broker ON public.support_tickets(broker_id);

-- 6. Funções RPC de matches (versões simples, estáveis e rápidas)
CREATE OR REPLACE FUNCTION public.find_property_matches(
  p_broker_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS SETOF public.imoveis
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM public.imoveis i
  WHERE (p_filters->>'city'    IS NULL OR i.city    = p_filters->>'city')
    AND (p_filters->>'purpose' IS NULL OR i.purpose = p_filters->>'purpose')
    AND (p_filters->>'min_price' IS NULL OR i.price >= (p_filters->>'min_price')::numeric)
    AND (p_filters->>'max_price' IS NULL OR i.price <= (p_filters->>'max_price')::numeric)
    AND (p_filters->>'bedrooms'  IS NULL OR i.bedrooms = (p_filters->>'bedrooms')::int)
  ORDER BY i.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION public.find_intelligent_property_matches(
  p_query text DEFAULT '',
  p_city text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS SETOF public.imoveis
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM public.imoveis i
  WHERE (p_query = '' OR i.search_vector @@ plainto_tsquery('simple', p_query))
    AND (p_city IS NULL OR i.city = p_city)
  ORDER BY
    CASE WHEN p_query = '' THEN 0 ELSE ts_rank(i.search_vector, plainto_tsquery('simple', p_query)) END DESC,
    i.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- 7. Garantias já combinadas (idempotentes; reexecutar sem medo)
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS norm_title text,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.fn_imoveis_set_fts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.norm_title := lower(regexp_replace(coalesce(NEW.title,''),'[^\w\s]+','','g'));
  NEW.search_vector :=
      setweight(to_tsvector('simple', coalesce(NEW.title,'')),'A')
    || setweight(to_tsvector('simple', coalesce(NEW.neighborhood,'')),'B')
    || setweight(to_tsvector('simple', coalesce(NEW.city,'')),'C')
    || setweight(to_tsvector('simple', coalesce(NEW.description,'')),'D');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_imoveis_fts ON public.imoveis;
CREATE TRIGGER tg_imoveis_fts BEFORE INSERT OR UPDATE ON public.imoveis
FOR EACH ROW EXECUTE PROCEDURE public.fn_imoveis_set_fts();

CREATE INDEX IF NOT EXISTS idx_imoveis_pub ON public.imoveis(is_public, visibility);
CREATE INDEX IF NOT EXISTS idx_imoveis_fts ON public.imoveis USING gin(search_vector);

-- invariantes imagens
CREATE UNIQUE INDEX IF NOT EXISTS ux_imovel_cover
  ON public.imovel_images (imovel_id) WHERE is_cover = true;
CREATE UNIQUE INDEX IF NOT EXISTS ux_imovel_storage_path
  ON public.imovel_images (imovel_id, storage_path);

-- minisites slug único
CREATE UNIQUE INDEX IF NOT EXISTS ux_minisites_slug ON public.minisites (lower(slug));

-- CRM uniques por broker (só quando há valor)
CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_clients_email_per_broker
  ON public.crm_clients (broker_id, lower(coalesce(email,'')))
  WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_clients_phone_per_broker
  ON public.crm_clients (broker_id, lower(coalesce(phone,'')))
  WHERE phone IS NOT NULL AND phone <> '';

-- RLS mínimo garantido
ALTER TABLE public.imoveis         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minisites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads           ENABLE ROW LEVEL SECURITY;