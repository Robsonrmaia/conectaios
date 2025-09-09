-- Phase 1: Critical Security Fixes (Corrected)

-- 1. Fix profiles table - prevent users from changing their own role
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

-- Create separate policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile name only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'user');

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Create secure admin function for role changes
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_profile profiles%ROWTYPE;
  target_profile profiles%ROWTYPE;
  result json;
BEGIN
  -- Check if current user is admin
  SELECT * INTO admin_profile 
  FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin';
  
  IF admin_profile.user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;
  
  -- Get target user
  SELECT * INTO target_profile 
  FROM profiles 
  WHERE user_id = target_user_id;
  
  IF target_profile.user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Prevent admin from demoting themselves
  IF target_user_id = auth.uid() AND new_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot change your own role'
    );
  END IF;
  
  -- Update role
  UPDATE profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the role change
  PERFORM log_audit_event(
    'role_change',
    'profiles',
    target_user_id,
    json_build_object('old_role', target_profile.role),
    json_build_object('new_role', new_role)
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Role updated successfully'
  );
END;
$$;

-- 3. Fix conectaios_brokers table policies - restrict public access
DROP POLICY IF EXISTS "Public can view limited business profile only" ON public.conectaios_brokers;
DROP POLICY IF EXISTS "Authenticated users can view broker business info" ON public.conectaios_brokers;
DROP POLICY IF EXISTS "Authenticated users can view business info only" ON public.conectaios_brokers;

-- New secure policies for conectaios_brokers
CREATE POLICY "Public can view basic business info only" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  auth.uid() IS NULL 
  AND status = 'active'
);

CREATE POLICY "Authenticated users can view extended business info" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND status = 'active' 
  AND auth.uid() != user_id
);

CREATE POLICY "Brokers can view their own complete profile" 
ON public.conectaios_brokers 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Brokers can update their own profile" 
ON public.conectaios_brokers 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their broker profile" 
ON public.conectaios_brokers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all broker profiles" 
ON public.conectaios_brokers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. Create function to check if user is admin (security definer)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- 5. Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type text,
  target_resource text,
  details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can log admin actions
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  PERFORM log_audit_event(
    action_type,
    target_resource,
    NULL,
    NULL,
    details
  );
END;
$$;