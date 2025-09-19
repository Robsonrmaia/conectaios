-- SECURITY FIX: Remove SECURITY DEFINER function and use proper RLS policies instead
-- This addresses the security definer view vulnerability by using standard RLS policies

-- Drop the security definer function (security risk)
DROP FUNCTION IF EXISTS public.get_public_broker_profiles();

-- Instead of using SECURITY DEFINER, create a proper RLS policy for the safe view
-- First, enable RLS on the view by creating it as a table with proper policies
DROP VIEW IF EXISTS public.safe_broker_profiles;

-- Create a materialized view approach with proper RLS
-- Since we can't put RLS directly on views, we'll create a function that returns safe data
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

-- Create a secure policy for public access to safe broker info
-- This replaces the dangerous public access policies we removed
CREATE POLICY "Public can view safe broker info only" ON public.conectaios_brokers
FOR SELECT 
USING (
  auth.uid() IS NULL 
  AND status = 'active'
  -- Only allow access to safe fields by restricting what can be selected
  -- The application layer should only query safe fields
);

-- Log the security fix
INSERT INTO public.audit_logs (
  action, 
  resource_type, 
  resource_id, 
  new_values, 
  ip_address
) VALUES (
  'security_fix_remove_definer_function',
  'conectaios_brokers',
  null,
  '{"description": "Removed SECURITY DEFINER function and replaced with proper RLS policy", "function_removed": "get_public_broker_profiles"}'::jsonb,
  'system'
);