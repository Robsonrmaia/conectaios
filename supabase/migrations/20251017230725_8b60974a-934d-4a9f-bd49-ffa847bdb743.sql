-- Reverter políticas RLS conflitantes do bucket property-videos
-- Manter apenas as políticas originais que funcionam corretamente com propertyId

DROP POLICY IF EXISTS "Users can upload videos to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can list their videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their videos" ON storage.objects;