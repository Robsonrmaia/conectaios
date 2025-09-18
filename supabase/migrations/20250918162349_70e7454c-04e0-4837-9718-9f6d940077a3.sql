-- Criar políticas RLS para acesso público aos imóveis nos minisites
-- Esta migração garante que imóveis marcados como públicos sejam acessíveis sem login

-- Política para leitura pública de imóveis nos minisites
CREATE POLICY IF NOT EXISTS "minisite_public_properties_read"
ON public.properties
FOR SELECT
TO anon
USING (
  is_public = true 
  AND visibility IN ('public_site', 'match_only')
  AND user_id IS NOT NULL
);

-- Política para leitura pública de conectaios_properties (se existir)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conectaios_properties') THEN
    EXECUTE 'CREATE POLICY IF NOT EXISTS "minisite_public_conectaios_properties_read"
    ON public.conectaios_properties
    FOR SELECT
    TO anon
    USING (
      broker_minisite_enabled = true 
      AND visibility IN (''public_site'', ''both'')
      AND user_id IS NOT NULL
    )';
  END IF;
END $$;

-- Política para leitura pública de imagens de imóveis no storage
CREATE POLICY IF NOT EXISTS "public_property_images_read"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'property-images');

-- Garantir que o bucket property-images seja público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'property-images';

-- Política para leitura pública de configurações de minisite
CREATE POLICY IF NOT EXISTS "public_minisite_configs_read"
ON public.minisite_configs
FOR SELECT
TO anon
USING (
  is_active = true
  AND generated_url IS NOT NULL
);

-- Política para leitura pública de dados básicos do corretor
CREATE POLICY IF NOT EXISTS "public_broker_basic_info_read"
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