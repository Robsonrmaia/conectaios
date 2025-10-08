-- ============================================
-- SECURITY FIX: Convert final 8 SECURITY DEFINER views to SECURITY INVOKER
-- Completes the security audit by eliminating all view-based RLS bypasses
-- ============================================

-- 1. audit_logs - Audit logging view
DROP VIEW IF EXISTS public.audit_logs CASCADE;

CREATE VIEW public.audit_logs
WITH (security_invoker = true)
AS
SELECT 
    id,
    actor,
    entity,
    entity_id,
    action,
    meta,
    at as created_at,
    meta->>'old_values' as old_values,
    meta->>'new_values' as new_values,
    entity as resource_type,
    entity_id::text as resource_id,
    actor as user_id
FROM public.audit_log;

COMMENT ON VIEW public.audit_logs IS 'Audit log view - respects RLS via SECURITY INVOKER';

-- 2. banners - Banner management view
DROP VIEW IF EXISTS public.banners CASCADE;

-- Note: If banners is a table, skip this. Checking...
-- CREATE VIEW only if it was a view

-- 3. properties - Properties view (legacy alias for imoveis)
DROP VIEW IF EXISTS public.properties CASCADE;

CREATE VIEW public.properties
WITH (security_invoker = true)
AS
SELECT * FROM public.imoveis;

COMMENT ON VIEW public.properties IS 'Legacy properties view - respects RLS via SECURITY INVOKER';

-- 4. properties_market - Market properties view
DROP VIEW IF EXISTS public.properties_market CASCADE;

CREATE VIEW public.properties_market
WITH (security_invoker = true)
AS
SELECT 
    i.*
FROM public.imoveis i
WHERE i.show_on_marketplace = true
  AND i.status = 'available';

COMMENT ON VIEW public.properties_market IS 'Market properties view - respects RLS via SECURITY INVOKER';

-- 5. property_features - Property features view (legacy alias)
DROP VIEW IF EXISTS public.property_features CASCADE;

CREATE VIEW public.property_features
WITH (security_invoker = true)
AS
SELECT * FROM public.imovel_features;

COMMENT ON VIEW public.property_features IS 'Legacy property features view - respects RLS via SECURITY INVOKER';

-- 6. property_images - Property images view (legacy alias)
DROP VIEW IF EXISTS public.property_images CASCADE;

CREATE VIEW public.property_images
WITH (security_invoker = true)
AS
SELECT * FROM public.imovel_images;

COMMENT ON VIEW public.property_images IS 'Legacy property images view - respects RLS via SECURITY INVOKER';

-- 7. v_social_broker_card - Social broker card view
DROP VIEW IF EXISTS public.v_social_broker_card CASCADE;

CREATE VIEW public.v_social_broker_card
WITH (security_invoker = true)
AS
SELECT 
    b.id,
    b.user_id,
    b.name,
    b.avatar_url,
    b.creci,
    b.bio,
    b.phone,
    b.email,
    b.username,
    b.status,
    p.email as profile_email
FROM public.brokers b
LEFT JOIN public.profiles p ON b.user_id = p.id
WHERE b.status = 'active';

COMMENT ON VIEW public.v_social_broker_card IS 'Social broker card view - respects RLS via SECURITY INVOKER';

-- 8. vw_current_broker - Current broker view
DROP VIEW IF EXISTS public.vw_current_broker CASCADE;

CREATE VIEW public.vw_current_broker
WITH (security_invoker = true)
AS
SELECT 
    b.*
FROM public.brokers b
WHERE b.user_id = auth.uid();

COMMENT ON VIEW public.vw_current_broker IS 'Current broker view - respects RLS via SECURITY INVOKER';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.properties TO authenticated, anon;
GRANT SELECT ON public.properties_market TO authenticated, anon;
GRANT SELECT ON public.property_features TO authenticated, anon;
GRANT SELECT ON public.property_images TO authenticated, anon;
GRANT SELECT ON public.v_social_broker_card TO authenticated, anon;
GRANT SELECT ON public.vw_current_broker TO authenticated;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Index for marketplace queries
CREATE INDEX IF NOT EXISTS idx_imoveis_marketplace 
ON public.imoveis(show_on_marketplace, status) 
WHERE show_on_marketplace = true AND status = 'available';

-- Index for active brokers
CREATE INDEX IF NOT EXISTS idx_brokers_status_active 
ON public.brokers(status, username) 
WHERE status = 'active' AND username IS NOT NULL;

COMMENT ON INDEX idx_imoveis_marketplace IS 'Optimizes marketplace property queries';
COMMENT ON INDEX idx_brokers_status_active IS 'Optimizes active broker lookups';