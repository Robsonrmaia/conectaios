-- Políticas RLS simplificadas para minisites (sem storage)
-- Foca apenas nas tabelas que podemos modificar

-- Política para leitura pública de imóveis nos minisites
DROP POLICY IF EXISTS "minisite_public_properties_read" ON public.properties;
CREATE POLICY "minisite_public_properties_read"
ON public.properties
FOR SELECT
TO anon
USING (
  is_public = true 
  AND visibility IN ('public_site', 'match_only')
  AND user_id IS NOT NULL
);

-- Política para leitura pública de configurações de minisite
DROP POLICY IF EXISTS "public_minisite_configs_read" ON public.minisite_configs;
CREATE POLICY "public_minisite_configs_read"
ON public.minisite_configs
FOR SELECT
TO anon
USING (
  is_active = true
  AND generated_url IS NOT NULL
);

-- Política para leitura pública de dados básicos do corretor
DROP POLICY IF EXISTS "public_broker_basic_info_read" ON public.conectaios_brokers;
CREATE POLICY "public_broker_basic_info_read"
ON public.conectaios_brokers
FOR SELECT
TO anon
USING (
  status = 'active'
);