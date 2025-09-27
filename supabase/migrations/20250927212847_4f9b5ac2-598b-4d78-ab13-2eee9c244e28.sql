-- Adicionar campos vista mar e distância do mar à tabela imoveis
ALTER TABLE public.imoveis 
ADD COLUMN IF NOT EXISTS vista_mar boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS distancia_mar numeric;