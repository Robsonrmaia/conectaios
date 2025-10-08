-- ========================================
-- MIGRATION: Sistema Multi-Cidade ConectaIOS
-- ========================================
-- Objetivo: Preparar banco para suportar múltiplas cidades
-- Autor: Sistema ConectaIOS
-- Data: 2025-01-XX
-- ========================================

-- 1. Normalizar cidades existentes (corrigir capitalização)
UPDATE public.imoveis 
SET city = INITCAP(TRIM(city))
WHERE city IS NOT NULL AND city != '';

-- 2. Definir cidade padrão para registros sem cidade
UPDATE public.imoveis 
SET city = 'Ilhéus'
WHERE city IS NULL OR city = '';

-- 3. Criar índice para melhorar performance de queries por cidade
CREATE INDEX IF NOT EXISTS idx_imoveis_city ON public.imoveis(city);

-- 4. Adicionar política RLS para validar cidades permitidas
CREATE POLICY "validate_city_on_insert" ON public.imoveis
FOR INSERT
WITH CHECK (
  city IN ('Ilhéus', 'Salvador', 'Itabuna', 'Itacaré', 'Canavieiras', 'Ubaitaba', 'Uruçuca', 'Una')
);

-- 5. Comentários para documentação
COMMENT ON COLUMN public.imoveis.city IS 'Cidade do imóvel - Obrigatório. Cidades válidas: Ilhéus, Salvador, Itabuna, Itacaré, Canavieiras, Ubaitaba, Uruçuca, Una';
COMMENT ON INDEX idx_imoveis_city IS 'Índice para otimizar filtros por cidade no marketplace';

-- ========================================
-- ROLLBACK (caso necessário)
-- ========================================
-- DROP POLICY IF EXISTS "validate_city_on_insert" ON public.imoveis;
-- DROP INDEX IF EXISTS idx_imoveis_city;
-- UPDATE public.imoveis SET city = NULL WHERE city = 'Ilhéus';