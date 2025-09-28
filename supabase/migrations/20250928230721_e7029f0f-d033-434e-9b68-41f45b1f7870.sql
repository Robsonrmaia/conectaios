-- Adicionar campos sociais à tabela brokers se não existirem
ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS linkedin text;