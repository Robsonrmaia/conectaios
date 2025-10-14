-- Migration: Permitir leitura pública de brokers ativos
-- Objetivo: Habilitar acesso anônimo aos minisites públicos

-- Criar política para permitir SELECT público em brokers ativos
CREATE POLICY "Public read access to active brokers"
ON public.brokers
FOR SELECT
TO public
USING (status = 'active');

-- Documentação
COMMENT ON POLICY "Public read access to active brokers" ON public.brokers IS 
  'Permite acesso anônimo (não autenticado) para visualizar brokers ativos. Necessário para minisites públicos funcionarem.';