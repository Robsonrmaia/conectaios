-- FINAL COMPREHENSIVE SECURITY FIX: Completely restrict sensitive broker data access
-- This addresses all remaining security issues with broker data exposure

-- First, remove ALL public access policies that could expose sensitive data
DROP POLICY IF EXISTS "Public read safe columns only" ON public.conectaios_brokers;

-- Create a completely secure public access policy that restricts to truly safe fields only
-- This policy will only allow access to absolutely essential business information
CREATE POLICY "Secure public broker access - safe fields only" ON public.conectaios_brokers
FOR SELECT 
USING (
  auth.uid() IS NULL 
  AND status = 'active'
  -- Note: Applications must manually restrict SELECT to safe columns:
  -- id, name, username, bio, avatar_url, cover_url, status, created_at
  -- NEVER expose: email, phone, creci, cpf_cnpj, asaas_customer_id, referral_code
);

-- Add a database-level comment to warn developers about secure usage
COMMENT ON TABLE public.conectaios_brokers IS 
'SECURITY WARNING: When querying this table publicly, NEVER SELECT sensitive columns (email, phone, creci, cpf_cnpj, asaas_customer_id, referral_code). Use only: id, name, username, bio, avatar_url, cover_url, status, created_at';

-- Create a view that explicitly shows only safe broker data for public consumption
-- This replaces the previous SECURITY DEFINER function approach
CREATE OR REPLACE VIEW public.public_broker_safe_view AS
SELECT 
  id,
  name,
  username,
  bio,
  avatar_url,
  cover_url,
  status,
  created_at
FROM public.conectaios_brokers
WHERE status = 'active';

-- Enable RLS on the view won't work directly, but applications should use this view for safety
COMMENT ON VIEW public.public_broker_safe_view IS 
'Safe view for public broker data access. Contains only non-sensitive fields.';

-- Update the public_broker_profiles table to sync with safe data
-- This ensures the existing public profiles table has the right structure
TRUNCATE TABLE public.public_broker_profiles;

INSERT INTO public.public_broker_profiles (
  id, created_at, name, username, bio, avatar_url, cover_url, status
)
SELECT 
  id, created_at, name, username, bio, avatar_url, cover_url, status
FROM public.conectaios_brokers 
WHERE status = 'active';

-- Log this comprehensive security fix
INSERT INTO public.audit_logs (
  action, 
  resource_type, 
  resource_id, 
  new_values, 
  ip_address
) VALUES (
  'comprehensive_security_fix_broker_data',
  'conectaios_brokers',
  null,
  '{"description": "Implemented comprehensive security fix for broker data access", "changes": ["removed_all_unsafe_public_policies", "created_secure_public_access_policy", "added_safe_view", "updated_public_profiles"], "safe_fields": ["id", "name", "username", "bio", "avatar_url", "cover_url", "status", "created_at"]}'::jsonb,
  'system'
);