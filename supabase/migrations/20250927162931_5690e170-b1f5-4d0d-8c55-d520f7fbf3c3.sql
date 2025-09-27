-- === PATCH SIMPLIFICADO — integridade, FTS, RLS ===============================
-- === Extensões básicas ======================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- === IMOVEIS: FKs, FTS, índices ==============================================
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS norm_title     text,
  ADD COLUMN IF NOT EXISTS search_vector  tsvector;

-- FK para profiles (se não existir)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='imoveis_owner_fk') THEN
    ALTER TABLE public.imoveis
      ADD CONSTRAINT imoveis_owner_fk FOREIGN KEY (owner_id)
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_imoveis_pub   ON public.imoveis(is_public, visibility);
CREATE INDEX IF NOT EXISTS idx_imoveis_fts   ON public.imoveis USING gin(search_vector);

-- Função FTS
CREATE OR REPLACE FUNCTION public.fn_imoveis_set_fts()
RETURNS trigger LANGUAGE plpgsql 
SET search_path = public
AS $$
BEGIN
  NEW.norm_title := lower(regexp_replace(coalesce(NEW.title,''),'[^\w\s]+','','g'));
  NEW.search_vector :=
      setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A')
    || setweight(to_tsvector('simple', coalesce(NEW.neighborhood,'')), 'B')
    || setweight(to_tsvector('simple', coalesce(NEW.city,'')), 'C')
    || setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'D');
  RETURN NEW;
END $$;

-- Trigger FTS
DROP TRIGGER IF EXISTS tg_imoveis_fts ON public.imoveis;
CREATE TRIGGER tg_imoveis_fts
  BEFORE INSERT OR UPDATE ON public.imoveis
  FOR EACH ROW EXECUTE PROCEDURE public.fn_imoveis_set_fts();

-- === IMAGENS: FKs e índices =================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='imovel_images_imovel_fk') THEN
    ALTER TABLE public.imovel_images
      ADD CONSTRAINT imovel_images_imovel_fk
      FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1 capa por imóvel
CREATE UNIQUE INDEX IF NOT EXISTS ux_imovel_cover
  ON public.imovel_images (imovel_id) WHERE is_cover = true;

CREATE INDEX IF NOT EXISTS idx_images_imovel ON public.imovel_images(imovel_id);

-- === FK para features ========================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='imovel_features_imovel_fk') THEN
    ALTER TABLE public.imovel_features
      ADD CONSTRAINT imovel_features_imovel_fk
      FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE;
  END IF;
END $$;

-- === MINISITES: FK ===========================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='minisites_owner_fk') THEN
    ALTER TABLE public.minisites
      ADD CONSTRAINT minisites_owner_fk FOREIGN KEY (owner_id) 
      REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_minisites_slug ON public.minisites (lower(slug));

-- === LEADS: índices ==========================================================
CREATE INDEX IF NOT EXISTS idx_leads_imovel ON public.leads(imovel_id);
CREATE INDEX IF NOT EXISTS idx_leads_broker ON public.leads(broker_id);

-- === CRM: índices ============================================================
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON public.crm_deals(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON public.crm_tasks(status);

-- === Função de busca =========================================================
CREATE OR REPLACE FUNCTION public.search_imoveis(
  q text DEFAULT '',
  city_filter text DEFAULT NULL,
  purpose_filter text DEFAULT NULL,
  limit_rows int DEFAULT 50,
  offset_rows int DEFAULT 0
) RETURNS SETOF public.imoveis
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.imoveis
  WHERE (q = '' OR search_vector @@ plainto_tsquery('simple', q))
    AND (city_filter IS NULL OR city = city_filter)
    AND (purpose_filter IS NULL OR purpose = purpose_filter)
  ORDER BY ts_rank(search_vector, plainto_tsquery('simple', q)) DESC NULLS LAST,
           created_at DESC
  LIMIT limit_rows OFFSET offset_rows;
$$;