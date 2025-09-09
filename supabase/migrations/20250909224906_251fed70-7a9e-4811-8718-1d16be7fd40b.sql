-- Fix infinite recursion in profiles table RLS policies
-- The issue is with the admin policy that references itself

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create a new secure admin policy using the security definer function
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles
FOR ALL
TO authenticated
USING (
  -- Use the existing security definer function instead of self-referencing
  get_current_user_role() = 'admin'
);

-- Also ensure the get_current_user_role function works correctly
-- Update it to be more robust and prevent recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1),
    'user'
  );
$$;