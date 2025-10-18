-- Adicionar políticas RLS para o bucket property-videos
-- Permite que usuários autenticados gerenciem vídeos em suas próprias pastas

-- Política para INSERT (upload de vídeos)
CREATE POLICY "Users can upload videos to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para SELECT (listar vídeos)
CREATE POLICY "Users can list their videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para DELETE (remover vídeos)
CREATE POLICY "Users can delete their videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para UPDATE (atualizar metadados)
CREATE POLICY "Users can update their videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);