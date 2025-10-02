-- Garantir que os campos existem com valores padrão corretos
DO $$ 
BEGIN
  -- Verificar se show_on_marketplace existe, senão criar
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='imoveis' AND column_name='show_on_marketplace') THEN
    ALTER TABLE public.imoveis ADD COLUMN show_on_marketplace boolean NOT NULL DEFAULT false;
  END IF;
  
  -- Verificar se show_on_minisite existe, senão criar  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='imoveis' AND column_name='show_on_minisite') THEN
    ALTER TABLE public.imoveis ADD COLUMN show_on_minisite boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Migrar dados existentes baseado em visibility atual
UPDATE public.imoveis SET
  show_on_marketplace = CASE 
    WHEN visibility = 'partners' THEN true
    ELSE false
  END,
  show_on_minisite = CASE
    WHEN visibility IN ('public_site', 'partners') AND is_public = true THEN true
    ELSE false
  END
WHERE show_on_marketplace = false AND show_on_minisite = false;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_imoveis_marketplace_active ON public.imoveis(owner_id, is_public, show_on_marketplace) WHERE show_on_marketplace = true;
CREATE INDEX IF NOT EXISTS idx_imoveis_minisite_active ON public.imoveis(owner_id, is_public, show_on_minisite) WHERE show_on_minisite = true;