-- Criar políticas RLS para acesso público aos imóveis nos minisites
-- Esta migração garante que imóveis marcados como públicos sejam acessíveis sem login

-- Primeiro, remover políticas existentes se existirem
DROP POLICY IF EXISTS "minisite_public_properties_read" ON public.properties;
DROP POLICY IF EXISTS "public_property_images_read" ON storage.objects;
DROP POLICY IF EXISTS "public_minisite_configs_read" ON public.minisite_configs;
DROP POLICY IF EXISTS "public_broker_basic_info_read" ON public.conectaios_brokers;

-- Política para leitura pública de imóveis nos minisites
CREATE POLICY "minisite_public_properties_read"
ON public.properties
FOR SELECT
TO anon
USING (
  is_public = true 
  AND visibility IN ('public_site', 'match_only')
  AND user_id IS NOT NULL
);

-- Política para leitura pública de imagens de imóveis no storage
CREATE POLICY "public_property_images_read"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'property-images');

-- Garantir que o bucket property-images seja público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'property-images';

-- Política para leitura pública de configurações de minisite
CREATE POLICY "public_minisite_configs_read"
ON public.minisite_configs
FOR SELECT
TO anon
USING (
  is_active = true
  AND generated_url IS NOT NULL
);

-- Política para leitura pública de dados básicos do corretor
CREATE POLICY "public_broker_basic_info_read"
ON public.conectaios_brokers
FOR SELECT
TO anon
USING (
  status = 'active'
);

-- Comentários para documentação
COMMENT ON POLICY "minisite_public_properties_read" ON public.properties IS 
'Permite acesso público (sem login) aos imóveis marcados como públicos para exibição em minisites';

COMMENT ON POLICY "public_property_images_read" ON storage.objects IS 
'Permite acesso público às imagens dos imóveis no bucket property-images';

COMMENT ON POLICY "public_minisite_configs_read" ON public.minisite_configs IS 
'Permite acesso público às configurações ativas de minisite';

COMMENT ON POLICY "public_broker_basic_info_read" ON public.conectaios_brokers IS 
'Permite acesso público aos dados básicos de corretores ativos para minisites';