-- Create RLS policies for anonymous access to broker minisites

-- Policy for conectaios_properties: allow anonymous users to read public properties
DROP POLICY IF EXISTS "Public can view public properties" ON public.conectaios_properties;
CREATE POLICY "Public can view public properties"
ON public.conectaios_properties
FOR SELECT
TO anon, authenticated
USING (is_public = true AND visibility = 'public_site');

-- Ensure conectaios_brokers policy allows anonymous access to active brokers
DROP POLICY IF EXISTS "Public can view active brokers" ON public.conectaios_brokers;
CREATE POLICY "Public can view active brokers"
ON public.conectaios_brokers
FOR SELECT
TO anon, authenticated
USING (status = 'active');

-- Also ensure contacts table allows anonymous inserts for contact forms
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contacts;
CREATE POLICY "Allow public contact form submissions"
ON public.contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);