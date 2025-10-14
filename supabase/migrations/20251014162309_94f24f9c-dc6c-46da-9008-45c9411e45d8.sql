-- Corrigir view para não expor auth.users
DROP VIEW IF EXISTS public.vw_current_broker;

CREATE OR REPLACE VIEW public.vw_current_broker AS
SELECT 
  b.id AS broker_id,
  b.user_id,
  COALESCE(b.name, p.name) AS display_name,
  COALESCE(b.email, p.email) AS email,
  b.phone,
  b.bio,
  b.creci,
  b.username,
  COALESCE(b.avatar_url, p.avatar_url) AS avatar_url,
  b.whatsapp,
  b.referral_code,
  b.status,
  b.subscription_status,
  b.subscription_expires_at,
  b.plan_id,
  b.region_id,
  b.cpf_cnpj,
  b.cover_url,
  b.website,
  b.instagram,
  b.linkedin,
  b.specialties,
  b.created_at,
  b.updated_at
FROM brokers b
LEFT JOIN profiles p ON p.id = b.user_id;

COMMENT ON VIEW public.vw_current_broker IS 
'Unified view for broker data with all required fields - security compliant';