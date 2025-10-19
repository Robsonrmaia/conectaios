-- ============================================
-- MIGRATION: Add video support to properties
-- Objetivo: Suportar até 2 vídeos por imóvel
-- ============================================

-- 1) Criar tabela unificada de mídia (imovel_media)
-- Compatível com imovel_images existente
CREATE TABLE IF NOT EXISTS public.imovel_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  filename TEXT,
  size_bytes BIGINT,
  duration_seconds INTEGER, -- para vídeos
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_imovel_media_imovel_id ON public.imovel_media(imovel_id);
CREATE INDEX IF NOT EXISTS idx_imovel_media_kind ON public.imovel_media(kind);
CREATE INDEX IF NOT EXISTS idx_imovel_media_is_cover ON public.imovel_media(is_cover);

-- 2) RLS Policies (copiar padrão de imovel_images)
ALTER TABLE public.imovel_media ENABLE ROW LEVEL SECURITY;

-- Leitura pública para imóveis publicados, ou owner
CREATE POLICY "imovel_media_select_public_or_owner"
  ON public.imovel_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.imoveis i
      WHERE i.id = imovel_media.imovel_id
      AND (i.visibility = 'public' OR i.owner_id = auth.uid())
    )
  );

-- Insert apenas pelo owner
CREATE POLICY "imovel_media_insert_owner"
  ON public.imovel_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.imoveis i
      WHERE i.id = imovel_media.imovel_id
      AND i.owner_id = auth.uid()
    )
  );

-- Update apenas pelo owner
CREATE POLICY "imovel_media_update_owner"
  ON public.imovel_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.imoveis i
      WHERE i.id = imovel_media.imovel_id
      AND i.owner_id = auth.uid()
    )
  );

-- Delete apenas pelo owner
CREATE POLICY "imovel_media_delete_owner"
  ON public.imovel_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.imoveis i
      WHERE i.id = imovel_media.imovel_id
      AND i.owner_id = auth.uid()
    )
  );

-- 3) Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_imovel_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_imovel_media_updated_at
  BEFORE UPDATE ON public.imovel_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_imovel_media_updated_at();

-- 4) Função para validar limite de vídeos (max 2)
CREATE OR REPLACE FUNCTION public.check_video_limit()
RETURNS TRIGGER AS $$
DECLARE
  video_count INTEGER;
BEGIN
  IF NEW.kind = 'video' THEN
    SELECT COUNT(*) INTO video_count
    FROM public.imovel_media
    WHERE imovel_id = NEW.imovel_id AND kind = 'video';
    
    IF video_count >= 2 THEN
      RAISE EXCEPTION 'Limite de 2 vídeos por imóvel atingido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_video_limit
  BEFORE INSERT ON public.imovel_media
  FOR EACH ROW
  EXECUTE FUNCTION public.check_video_limit();

-- 5) Comentários para documentação
COMMENT ON TABLE public.imovel_media IS 'Tabela unificada de mídia (fotos e vídeos) para imóveis';
COMMENT ON COLUMN public.imovel_media.kind IS 'Tipo de mídia: image ou video';
COMMENT ON COLUMN public.imovel_media.duration_seconds IS 'Duração do vídeo em segundos (apenas para videos)';
COMMENT ON COLUMN public.imovel_media.size_bytes IS 'Tamanho do arquivo em bytes (limite: 100MB para vídeos)';