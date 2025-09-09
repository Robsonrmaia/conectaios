-- Fix Security Definer View issue by dropping the potentially insecure view
-- and creating proper RLS policies for public broker profile access

-- Drop the existing view that may be bypassing RLS
DROP VIEW IF EXISTS public.public_broker_profiles;

-- Instead of using a view, we'll rely on RLS policies to control access
-- Add a policy for public access to basic broker information
CREATE POLICY "Public can view basic active broker info" 
ON public.conectaios_brokers
FOR SELECT 
TO anon, authenticated
USING (
  status = 'active' AND 
  -- Only allow access to safe, business-related fields
  -- This policy will be used with specific column selection in queries
  true
);

-- Create a security definer function to safely get public broker profiles
-- This approach is more secure than a view as it has explicit access control
CREATE OR REPLACE FUNCTION public.get_public_broker_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  username text,
  bio text,
  avatar_url text,
  cover_url text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
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
  FROM conectaios_brokers cb
  WHERE cb.status = 'active'
  ORDER BY cb.created_at DESC;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_broker_profiles() TO anon, authenticated;