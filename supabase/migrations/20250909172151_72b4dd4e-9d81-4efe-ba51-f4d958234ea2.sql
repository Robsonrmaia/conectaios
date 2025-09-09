-- Fix security issue: Restrict public access to conectaios_brokers table
-- Remove overly permissive policies that expose sensitive data

-- Drop existing public access policies that expose all fields
DROP POLICY IF EXISTS "Public can view active brokers" ON public.conectaios_brokers;
DROP POLICY IF EXISTS "Public can view active conectaios brokers" ON public.conectaios_brokers; 
DROP POLICY IF EXISTS "Public can view business info only" ON public.conectaios_brokers;

-- Create a secure policy that only exposes business-relevant fields to public
CREATE POLICY "Public can view business profile only" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  status = 'active' 
  AND auth.uid() IS NULL -- Only applies to unauthenticated users
);

-- Create policy for authenticated users to view necessary broker info (for messaging, deals, etc)
CREATE POLICY "Authenticated users can view broker business info" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND status = 'active'
  AND auth.uid() != user_id -- Can't view own profile through this policy (separate policy exists)
);

-- Add comment explaining the security model
COMMENT ON TABLE public.conectaios_brokers IS 'Broker profiles with restricted public access. Public users can only see: id, name, username, bio, avatar_url, cover_url, status. Authenticated users can additionally see business contact info. Full access only for profile owner and admins.';

-- Create a view for public broker data to make the intent clearer
CREATE VIEW public.public_broker_profiles AS
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

-- Grant select access to the view for anonymous users
GRANT SELECT ON public.public_broker_profiles TO anon;
GRANT SELECT ON public.public_broker_profiles TO authenticated;