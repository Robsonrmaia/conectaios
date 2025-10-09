-- 1.1. Adicionar campos na tabela imoveis para OLX
ALTER TABLE public.imoveis 
ADD COLUMN IF NOT EXISTS olx_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS olx_published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS olx_data JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.imoveis.olx_enabled IS 'Imóvel marcado para publicação no OLX';
COMMENT ON COLUMN public.imoveis.olx_published_at IS 'Última vez que foi enviado ao OLX';
COMMENT ON COLUMN public.imoveis.olx_data IS 'Dados extras para OLX (contato, observações, etc)';

-- Índice para performance em consultas OLX
CREATE INDEX IF NOT EXISTS idx_imoveis_olx_enabled 
ON public.imoveis(owner_id, olx_enabled) 
WHERE olx_enabled = TRUE;

-- 1.2. Adicionar limite OLX nos planos
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS olx_publication_limit INTEGER DEFAULT 0;

COMMENT ON COLUMN public.plans.olx_publication_limit IS 'Quantidade máxima de imóveis para publicar no OLX';

-- 1.3. Configurar limites por plano (Básico: 0, Premium: 2, Professional: 5)
UPDATE public.plans 
SET olx_publication_limit = CASE 
  WHEN LOWER(name) LIKE '%b_sico%' OR LOWER(name) LIKE '%basic%' THEN 0
  WHEN LOWER(name) LIKE '%premium%' OR price BETWEEN 100 AND 200 THEN 2
  WHEN LOWER(name) LIKE '%professional%' OR LOWER(name) LIKE '%profissional%' OR price > 200 THEN 5
  ELSE 0
END
WHERE olx_publication_limit = 0;

-- 1.4. Função para obter limite OLX do corretor
CREATE OR REPLACE FUNCTION public.get_broker_olx_limit(p_broker_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  SELECT COALESCE(p.olx_publication_limit, 0)
  INTO v_limit
  FROM public.brokers b
  LEFT JOIN public.plans p ON p.id = b.plan_id
  WHERE b.id = p_broker_id
  AND b.subscription_status IN ('active', 'trial');
  
  RETURN COALESCE(v_limit, 0);
END;
$$;

-- 1.5. RLS Policy para corretores gerenciarem olx_enabled de seus imóveis
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'imoveis' 
    AND policyname = 'Corretores podem gerenciar olx_enabled de seus imóveis'
  ) THEN
    CREATE POLICY "Corretores podem gerenciar olx_enabled de seus imóveis" 
    ON public.imoveis 
    FOR UPDATE 
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;