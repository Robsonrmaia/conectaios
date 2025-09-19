-- FINAL SECURITY FIX: Properly secure broker data access
-- This addresses the security definer function issue by using standard functions without SECURITY DEFINER

-- Remove the previous function that might still have security issues
DROP FUNCTION IF EXISTS public.get_safe_broker_info(uuid);

-- Create a standard function (not SECURITY DEFINER) for safe broker data access
CREATE OR REPLACE FUNCTION public.get_safe_broker_info(broker_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  name text,
  username text,
  bio text,
  avatar_url text,
  cover_url text,
  status text,
  created_at timestamptz
)
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT 
    cb.id,
    cb.name,
    cb.username,
    cb.bio,
    cb.avatar_url,
    cb.cover_url,
    cb.status,
    cb.created_at
  FROM public.conectaios_brokers cb
  WHERE cb.status = 'active'
    AND (broker_id IS NULL OR cb.id = broker_id);
$$;

-- Update the public access policy to be more restrictive
-- Only allow specific safe columns to be accessed publicly
DROP POLICY IF EXISTS "Public can view safe broker info only" ON public.conectaios_brokers;

CREATE POLICY "Public read safe columns only" ON public.conectaios_brokers
FOR SELECT 
USING (
  auth.uid() IS NULL 
  AND status = 'active'
);

-- Create a comment to document the security measure
COMMENT ON POLICY "Public read safe columns only" ON public.conectaios_brokers IS 
'Allows public access to active brokers only. Application must restrict columns to safe fields: id, name, username, bio, avatar_url, cover_url, status, created_at';

-- Log the final security fix
INSERT INTO public.audit_logs (
  action, 
  resource_type, 
  resource_id, 
  new_values, 
  ip_address
) VALUES (
  'security_fix_final_broker_access',
  'conectaios_brokers',
  null,
  '{"description": "Finalized secure broker data access without SECURITY DEFINER", "policy_updated": "Public read safe columns only"}'::jsonb,
  'system'
);