-- Adicionar coluna videos como JSONB se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'imoveis' 
    AND column_name = 'videos'
  ) THEN
    ALTER TABLE public.imoveis 
    ADD COLUMN videos JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Garantir que a coluna seja JSONB
ALTER TABLE public.imoveis 
ALTER COLUMN videos TYPE JSONB USING COALESCE(videos, '[]'::jsonb);

ALTER TABLE public.imoveis 
ALTER COLUMN videos SET DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.imoveis.videos IS 
'Array de objetos com vídeos: {type: "url"|"upload", url: string, thumbnail?: string, title?: string, filename?: string, size?: number}';

-- Criar bucket de storage para vídeos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-videos',
  'property-videos',
  true,
  104857600, -- 100MB em bytes
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Corretores podem fazer upload de vídeos nos seus imóveis
DROP POLICY IF EXISTS "Owners can upload property videos" ON storage.objects;
CREATE POLICY "Owners can upload property videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-videos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM imoveis WHERE owner_id = auth.uid()
  )
);

-- RLS: Todos podem visualizar vídeos públicos
DROP POLICY IF EXISTS "Public videos are viewable" ON storage.objects;
CREATE POLICY "Public videos are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-videos');

-- RLS: Owners podem deletar seus vídeos
DROP POLICY IF EXISTS "Owners can delete their videos" ON storage.objects;
CREATE POLICY "Owners can delete their videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-videos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM imoveis WHERE owner_id = auth.uid()
  )
);