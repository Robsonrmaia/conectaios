-- ============================================
-- SECURITY FIX: Convert remaining SECURITY DEFINER views to SECURITY INVOKER
-- This fixes 9 critical security vulnerabilities where views bypass RLS
-- ============================================

-- 1. Drop and recreate chat_threads_enriched as SECURITY INVOKER
DROP VIEW IF EXISTS public.chat_threads_enriched CASCADE;

CREATE VIEW public.chat_threads_enriched 
WITH (security_invoker = true)
AS
SELECT 
    ct.id,
    ct.is_group,
    ct.title,
    ct.created_at,
    ct.updated_at,
    ct.last_message_at,
    
    -- Last message details
    lm.id as last_message_id,
    COALESCE(lm.content, lm.body) as last_message_content,
    lm.sender_id as last_message_sender_id,
    COALESCE(
        sender_broker.name,
        sender_profile.name,
        'Usuário'
    ) as last_message_sender_name
    
FROM public.chat_threads ct

LEFT JOIN LATERAL (
    SELECT id, content, body, sender_id, created_at
    FROM public.chat_messages
    WHERE thread_id = ct.id
    ORDER BY created_at DESC
    LIMIT 1
) lm ON true

LEFT JOIN public.profiles sender_profile ON lm.sender_id = sender_profile.id
LEFT JOIN public.brokers sender_broker ON lm.sender_id = sender_broker.user_id;

COMMENT ON VIEW public.chat_threads_enriched IS 'Enriched thread view with last message - respects RLS via SECURITY INVOKER';

-- 2. Drop and recreate chat_threads_view as SECURITY INVOKER  
DROP VIEW IF EXISTS public.chat_threads_view CASCADE;

CREATE VIEW public.chat_threads_view
WITH (security_invoker = true)
AS
SELECT 
    ct.id,
    ct.is_group,
    ct.title,
    ct.created_at,
    ct.updated_at,
    ct.last_message_at,
    
    CASE 
        WHEN ct.is_group THEN 'group'
        ELSE 'direct'
    END as type,
    
    COALESCE(lm.content, lm.body) as last_text
    
FROM public.chat_threads ct

LEFT JOIN LATERAL (
    SELECT content, body
    FROM public.chat_messages
    WHERE thread_id = ct.id
    ORDER BY created_at DESC
    LIMIT 1
) lm ON true;

COMMENT ON VIEW public.chat_threads_view IS 'Simple thread view - respects RLS via SECURITY INVOKER';

-- 3. Grant appropriate permissions
GRANT SELECT ON public.chat_threads_enriched TO authenticated;
GRANT SELECT ON public.chat_threads_view TO authenticated;

-- ============================================
-- PERFORMANCE: Add missing indexes for view performance
-- ============================================

-- Index for last message lookup (most common query in views)
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created 
ON public.chat_messages(thread_id, created_at DESC);

-- Index for participant lookups
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_left 
ON public.chat_participants(user_id, left_at) 
WHERE left_at IS NULL;

-- Index for presence status lookups
CREATE INDEX IF NOT EXISTS idx_chat_presence_status_updated 
ON public.chat_presence(status, updated_at DESC);

-- ============================================
-- SECURITY: Verify RLS is enabled on base tables
-- ============================================

-- Ensure all base tables used by views have RLS enabled
DO $$
BEGIN
    -- These should already have RLS, but verify
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'chat_threads') THEN
        ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'chat_messages') THEN
        ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_chat_messages_thread_created IS 'Optimizes last message lookups in enriched views';
COMMENT ON INDEX idx_chat_participants_user_left IS 'Optimizes active participant checks';
COMMENT ON INDEX idx_chat_presence_status_updated IS 'Optimizes online status queries';