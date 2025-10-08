-- ============================================
-- CORREÇÃO DE VULNERABILIDADES - APENAS VIEWS
-- ConectaIOS Security Fixes V3
-- ============================================

-- CORRIGIR VIEWS COM SECURITY DEFINER
-- Recriar views críticas com SECURITY INVOKER para respeitar RLS

-- 1. chat_users - não deve referenciar auth.users
DROP VIEW IF EXISTS chat_users CASCADE;
CREATE VIEW chat_users 
WITH (security_invoker=true) AS
SELECT 
  p.id,
  p.email,
  p.name,
  CASE 
    WHEN b.user_id IS NOT NULL THEN 'broker'
    ELSE 'user'
  END as user_type,
  b.phone,
  b.creci,
  b.status,
  b.bio,
  b.avatar_url
FROM profiles p
LEFT JOIN brokers b ON p.id = b.user_id;


-- 2. conectaios_brokers - apenas brokers ativos
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
  b.created_at,
  b.updated_at
FROM brokers b
WHERE b.status = 'active';


-- 3. chat_participants_enriched - sem auth.users
DROP VIEW IF EXISTS chat_participants_enriched CASCADE;
CREATE VIEW chat_participants_enriched
WITH (security_invoker=true) AS
SELECT 
  cp.id,
  cp.thread_id,
  cp.user_id,
  cp.joined_at,
  cp.left_at,
  cp.role,
  p.name as user_name,
  b.avatar_url as user_avatar,
  b.creci as user_creci,
  CASE 
    WHEN presence.status = 'online' THEN true
    ELSE false
  END as is_online
FROM chat_participants cp
LEFT JOIN profiles p ON cp.user_id = p.id
LEFT JOIN brokers b ON cp.user_id = b.user_id
LEFT JOIN chat_presence presence ON cp.user_id = presence.user_id;


-- 4. ADICIONAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_audit_log_actor 
ON audit_log(actor) 
WHERE actor IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_at 
ON audit_log(at DESC);

CREATE INDEX IF NOT EXISTS idx_brokers_status 
ON brokers(status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_chat_presence_status 
ON chat_presence(user_id, status) 
WHERE status = 'online';


-- 5. DOCUMENTAÇÃO
COMMENT ON VIEW chat_users IS 
  'View segura - usa profiles ao invés de auth.users, respeita RLS via security_invoker';

COMMENT ON VIEW conectaios_brokers IS 
  'View segura - filtra apenas brokers ativos, usa security_invoker para respeitar RLS';

COMMENT ON VIEW chat_participants_enriched IS 
  'View enriquecida - sem exposição de auth.users, usa security_invoker';