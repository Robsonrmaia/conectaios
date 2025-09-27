-- Banco: invariantes e triggers para gestão de imagens
-- Única capa por imóvel
CREATE UNIQUE INDEX IF NOT EXISTS ux_imovel_cover
ON public.imovel_images (imovel_id)
WHERE is_cover = true;

-- Evitar arquivo duplicado por imóvel
CREATE UNIQUE INDEX IF NOT EXISTS ux_imovel_storage_path
ON public.imovel_images (imovel_id, storage_path);

-- Trigger updated_at para imovel_images se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_imovel_images_updated') THEN
    CREATE TRIGGER tg_imovel_images_updated 
    BEFORE UPDATE ON public.imovel_images 
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;