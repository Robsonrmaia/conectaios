-- Fix the SECURITY DEFINER issue with the view
-- Drop and recreate the view without SECURITY DEFINER

DROP VIEW IF EXISTS public.public_broker_profiles;

-- Create a regular view (no SECURITY DEFINER) for public broker data
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

-- The view will inherit RLS policies from the underlying table
-- Grant select access to the view
GRANT SELECT ON public.public_broker_profiles TO anon;
GRANT SELECT ON public.public_broker_profiles TO authenticated;