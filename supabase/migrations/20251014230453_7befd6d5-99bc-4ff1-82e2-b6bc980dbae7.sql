-- Migration: Adicionar username na view conectaios_brokers
-- Objetivo: Expor coluna username que existe na tabela brokers

-- Recriar view conectaios_brokers incluindo username
DROP VIEW IF EXISTS conectaios_brokers CASCADE;

CREATE VIEW conectaios_brokers 
WITH (security_invoker=true) AS
SELECT 
  b.id,
  b.user_id,
  b.name,
  b.email,
  b.phone,
  b.creci,
  b.bio,
  b.avatar_url,
  b.cover_url,
  b.status,
  b.plan_id,
  b.subscription_status,
  b.subscription_expires_at,
  b.referral_code,
  b.cpf_cnpj,
  b.region_id,
  b.username,              -- ← ADICIONAR ESTA LINHA
  b.created_at,
  b.updated_at
FROM brokers b
WHERE b.status = 'active';

-- Documentação
COMMENT ON VIEW conectaios_brokers IS 
  'View segura - filtra apenas brokers ativos, inclui username, usa security_invoker para respeitar RLS';