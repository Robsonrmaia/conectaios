-- Fix RLS policies for conectaios_properties table

-- First check if table has RLS enabled
ALTER TABLE public.conectaios_properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view public conectaios properties" ON public.conectaios_properties;
DROP POLICY IF EXISTS "Users can manage their own conectaios properties" ON public.conectaios_properties;
DROP POLICY IF EXISTS "Brokers can manage their own conectaios properties" ON public.conectaios_properties;

-- Create correct policy for anonymous and authenticated users to view public properties
CREATE POLICY "Public can view public conectaios properties"
ON public.conectaios_properties
FOR SELECT
TO anon, authenticated
USING (is_public = true AND visibility = 'public_site');

-- Create policy for authenticated users to manage their own properties
CREATE POLICY "Users can manage their own conectaios properties"  
ON public.conectaios_properties
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Also fix conectaios_brokers to ensure anonymous access works
DROP POLICY IF EXISTS "Public can view active conectaios brokers" ON public.conectaios_brokers;
CREATE POLICY "Public can view active conectaios brokers"
ON public.conectaios_brokers
FOR SELECT
TO anon, authenticated
USING (status = 'active');