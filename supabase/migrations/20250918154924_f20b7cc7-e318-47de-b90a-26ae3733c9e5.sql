-- Security improvements and RLS enforcement
-- This migration addresses security issues identified by the linter

-- 1. Fix security definer functions by setting proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1),
    'user'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- 2. Enhance RLS policies for critical tables
-- Ensure all sensitive tables have proper RLS

-- Update profiles table policy to be more restrictive
DROP POLICY IF EXISTS "Users can update their own profile name only" ON public.profiles;
CREATE POLICY "Users can update their own profile name only"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent role escalation
  (OLD.role = NEW.role OR get_current_user_role() = 'admin')
);

-- Add missing RLS policies for security-critical operations
CREATE POLICY "Only authenticated users can access system settings"
ON public.system_settings FOR SELECT
USING (auth.uid() IS NOT NULL AND get_current_user_role() = 'admin');

-- 3. Create audit trigger for sensitive table access
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive data
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit trigger to sensitive tables
DROP TRIGGER IF EXISTS audit_conectaios_brokers_access ON public.conectaios_brokers;
CREATE TRIGGER audit_conectaios_brokers_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.conectaios_brokers
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

-- 4. Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_user_input(input_text TEXT, max_length INTEGER DEFAULT 1000)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic validation
  IF input_text IS NULL OR LENGTH(input_text) > max_length THEN
    RETURN FALSE;
  END IF;
  
  -- Check for potential XSS/injection patterns
  IF input_text ~* '<script|javascript:|data:|vbscript:|onload=|onerror=' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create function to rotate API access (for admin use)
CREATE OR REPLACE FUNCTION public.admin_rotate_api_access()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Only admins can rotate API access
  IF get_current_user_role() != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;
  
  -- Log the rotation event
  PERFORM log_audit_event('api_rotation', 'system', null, null, json_build_object('timestamp', now()));
  
  result := json_build_object(
    'success', true,
    'message', 'API rotation logged. Please regenerate keys in Supabase dashboard.',
    'timestamp', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;