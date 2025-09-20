-- Ajustar tabela properties para suportar feeds CNM e VrSync
-- Adicionar colunas necessárias se não existirem
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS source_portal text,
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS finalidade text,
ADD COLUMN IF NOT EXISTS tipo text,
ADD COLUMN IF NOT EXISTS preco numeric,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS area_privativa numeric,
ADD COLUMN IF NOT EXISTS area_total numeric,
ADD COLUMN IF NOT EXISTS banheiros integer,
ADD COLUMN IF NOT EXISTS vagas integer,
ADD COLUMN IF NOT EXISTS thumb_url text,
ADD COLUMN IF NOT EXISTS galeria_urls text[],
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ATIVO',
ADD COLUMN IF NOT EXISTS site_id text,
ADD COLUMN IF NOT EXISTS raw_cnm jsonb,
ADD COLUMN IF NOT EXISTS raw_vrsync jsonb,
ADD COLUMN IF NOT EXISTS imported_at timestamptz;

-- Criar índice único para source_portal + external_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_properties_source_ext 
ON public.properties(source_portal, external_id)
WHERE source_portal IS NOT NULL AND external_id IS NOT NULL;

-- Criar índice para slug único
CREATE UNIQUE INDEX IF NOT EXISTS uq_properties_slug 
ON public.properties(slug)
WHERE slug IS NOT NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_properties_public_visibility 
ON public.properties(is_public, visibility)
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_properties_source_portal 
ON public.properties(source_portal);

-- Criar tabela de logs de integração
CREATE TABLE IF NOT EXISTS public.integrations_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz DEFAULT now(),
  source_portal text NOT NULL,
  dry_run boolean DEFAULT false,
  fetched_count integer DEFAULT 0,
  created_count integer DEFAULT 0,
  updated_count integer DEFAULT 0,
  ignored_count integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  hash text,
  execution_time_ms integer,
  feed_url text,
  notes text
);

-- Criar índices para logs
CREATE INDEX IF NOT EXISTS idx_integrations_logs_source_portal 
ON public.integrations_logs(source_portal, run_at DESC);

-- Criar view para propriedades públicas (minisite)
CREATE OR REPLACE VIEW public.v_public_properties AS
SELECT 
  id,
  titulo,
  slug,
  thumb_url,
  preco,
  bairro,
  cidade,
  quartos,
  banheiros,
  COALESCE(area_privativa, area_total) as metragem,
  updated_at as created_at,
  finalidade,
  tipo,
  endereco,
  area_total,
  area_privativa,
  vagas,
  galeria_urls,
  descricao,
  source_portal
FROM public.properties
WHERE is_public = true AND visibility = 'public_site' AND status != 'INATIVO';

-- Habilitar RLS na tabela de logs
ALTER TABLE public.integrations_logs ENABLE ROW LEVEL SECURITY;

-- Política para logs - apenas admins podem ver
CREATE POLICY "admin_access_integration_logs"
ON public.integrations_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Atualizar política pública para minisite incluir novos campos
DROP POLICY IF EXISTS "public_read_minisite" ON public.properties;
CREATE POLICY "public_read_minisite"
ON public.properties 
FOR SELECT 
TO anon, authenticated
USING (
  is_public = true 
  AND visibility = 'public_site' 
  AND status != 'INATIVO'
);

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION public.generate_property_slug(p_titulo text, p_cidade text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Criar slug base
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        unaccent(COALESCE(p_titulo, '') || '-' || COALESCE(p_cidade, '')),
        '[^a-zA-Z0-9\-]', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  
  -- Remover hífens do início e fim
  base_slug := trim(base_slug, '-');
  
  -- Garantir que não está vazio
  IF length(base_slug) < 3 THEN
    base_slug := 'imovel-' || extract(epoch from now())::bigint;
  END IF;
  
  final_slug := base_slug;
  
  -- Verificar unicidade e adicionar counter se necessário
  WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;