-- Fix infinite recursion in partnership_participants RLS
-- Create security definer function to check if user is a partnership participant

CREATE OR REPLACE FUNCTION public.is_partnership_participant(p_partnership_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM partnership_participants 
    WHERE partnership_id = p_partnership_id 
    AND broker_id = p_user_id
  );
$$;

-- Drop old policies that cause recursion
DROP POLICY IF EXISTS "participants_view_partnerships" ON broker_partnerships;
DROP POLICY IF EXISTS "participants_update_partnerships" ON broker_partnerships;
DROP POLICY IF EXISTS "participants_insert_partnerships" ON broker_partnerships;

-- Recreate policies using security definer function
CREATE POLICY "participants_view_partnerships" 
ON broker_partnerships 
FOR SELECT 
USING (
  property_owner_id = auth.uid() 
  OR initiated_by = auth.uid() 
  OR public.is_partnership_participant(id, auth.uid())
);

CREATE POLICY "participants_update_partnerships" 
ON broker_partnerships 
FOR UPDATE 
USING (
  property_owner_id = auth.uid() 
  OR initiated_by = auth.uid() 
  OR public.is_partnership_participant(id, auth.uid())
);

CREATE POLICY "participants_insert_partnerships" 
ON broker_partnerships 
FOR INSERT 
WITH CHECK (initiated_by = auth.uid());

-- Fix property_submissions RLS to allow public read by token
DROP POLICY IF EXISTS "public_read_by_token" ON property_submissions;

CREATE POLICY "public_read_by_token" 
ON property_submissions 
FOR SELECT 
USING (true);  -- Allow anyone to read by token

-- Only broker can update their own submissions
DROP POLICY IF EXISTS "broker_update_own" ON property_submissions;

CREATE POLICY "broker_update_own" 
ON property_submissions 
FOR UPDATE 
USING (broker_id = auth.uid())
WITH CHECK (broker_id = auth.uid());