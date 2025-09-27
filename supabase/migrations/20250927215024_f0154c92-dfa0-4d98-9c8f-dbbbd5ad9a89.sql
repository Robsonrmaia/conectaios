-- Views de compatibilidade para tabelas legadas
-- Criar views apenas para property_images e property_features (que não existem)

-- PROPERTY_IMAGES → IMOVEL_IMAGES  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='property_images'
  ) THEN
    CREATE VIEW public.property_images AS
    SELECT
      img.id,
      img.imovel_id AS property_id,
      img.url, img.storage_path, img.is_cover, img.position, img.created_at
    FROM public.imovel_images img;
  END IF;
END $$;

-- PROPERTY_FEATURES → IMOVEL_FEATURES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='property_features'
  ) THEN
    CREATE VIEW public.property_features AS
    SELECT
      f.imovel_id AS property_id,
      f.key, f.value
    FROM public.imovel_features f;
  END IF;
END $$;