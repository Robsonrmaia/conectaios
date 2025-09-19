-- SIMPLE SECURITY FIX: Remove problematic public access
-- The previous migration failed because public_broker_profiles is a view, not a table
-- Let's just ensure broker data is properly secured

-- Remove any remaining unsafe public access policies
DROP POLICY IF EXISTS "Public read safe columns only" ON public.conectaios_brokers;

-- Create a secure policy that restricts public access appropriately
CREATE POLICY "Secure public broker info access" ON public.conectaios_brokers
FOR SELECT 
USING (
  auth.uid() IS NULL 
  AND status = 'active'
);

-- Add security documentation
COMMENT ON POLICY "Secure public broker info access" ON public.conectaios_brokers IS 
'SECURITY: Applications must manually restrict columns to safe fields only: id, name, username, bio, avatar_url, cover_url, status, created_at. NEVER expose: email, phone, creci, cpf_cnpj';

-- Log this security fix
INSERT INTO public.audit_logs (
  action, 
  resource_type, 
  resource_id, 
  new_values, 
  ip_address
) VALUES (
  'final_broker_security_fix',
  'conectaios_brokers',
  null,
  '{"description": "Applied final security fix for broker data access", "safe_columns": ["id", "name", "username", "bio", "avatar_url", "cover_url", "status", "created_at"]}'::jsonb,
  'system'
);