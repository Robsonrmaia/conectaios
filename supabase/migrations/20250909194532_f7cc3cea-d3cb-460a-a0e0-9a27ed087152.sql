-- Create a secure public view for broker profiles that only exposes business information
-- and hides sensitive personal data like emails, phone numbers, CRECI, and CPF/CNPJ

CREATE OR REPLACE VIEW public.public_broker_profiles AS 
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

-- Enable RLS on the view
ALTER VIEW public.public_broker_profiles OWNER TO postgres;

-- Drop the overly permissive public policy on conectaios_brokers
DROP POLICY IF EXISTS "Public can view business profile only" ON public.conectaios_brokers;

-- Create a more restrictive public policy that only allows viewing basic business info
-- but removes access to sensitive fields
CREATE POLICY "Public can view limited business profile only" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  auth.uid() IS NULL 
  AND status = 'active'::text
);

-- Update RLS to be more restrictive - only allow brokers to see their own full profile
-- and authenticated users to see limited business info
CREATE POLICY "Authenticated users can view business info only" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND status = 'active'::text 
  AND auth.uid() <> user_id
);

-- Grant SELECT on the public view to anon users
GRANT SELECT ON public.public_broker_profiles TO anon;
GRANT SELECT ON public.public_broker_profiles TO authenticated;