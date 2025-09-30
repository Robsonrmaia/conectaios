-- Adicionar coluna construction_year para ano de construção
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS construction_year INTEGER;