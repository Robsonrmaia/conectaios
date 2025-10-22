-- Adicionar colunas para suporte a vídeos de URL e título
ALTER TABLE public.imovel_media 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'upload' CHECK (media_type IN ('upload', 'url'));

ALTER TABLE public.imovel_media 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_imovel_media_type ON public.imovel_media(media_type);

COMMENT ON COLUMN public.imovel_media.media_type IS 'Tipo de mídia: upload (arquivo enviado) ou url (link externo como YouTube/Vimeo)';
COMMENT ON COLUMN public.imovel_media.title IS 'Título do vídeo (opcional)';