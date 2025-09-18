-- Fixed security improvements and RLS enforcement
-- Correcting the trigger syntax

-- 1. Create audit trigger for sensitive table modifications (not SELECT)
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log modifications to sensitive data (INSERT, UPDATE, DELETE)
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add audit trigger to sensitive tables for modifications only
DROP TRIGGER IF EXISTS audit_conectaios_brokers_changes ON public.conectaios_brokers;
CREATE TRIGGER audit_conectaios_brokers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.conectaios_brokers
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

-- 2. Add enhanced security policies for API access
CREATE POLICY "Only admins can manage system settings"
ON public.system_settings FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 3. Restrict access to audit logs more strictly  
DROP POLICY IF EXISTS "Only admins can access audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can read audit logs"
ON public.audit_logs FOR SELECT
USING (get_current_user_role() = 'admin');

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- 4. Add rate limiting function (basic implementation)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_identifier TEXT,
  action_type TEXT,
  max_requests INTEGER DEFAULT 100,
  time_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Count recent requests from this user for this action
  SELECT COUNT(*)
  INTO current_count
  FROM public.audit_logs
  WHERE 
    (user_id = auth.uid() OR ip_address = user_identifier)
    AND action = action_type
    AND created_at > (now() - interval '1 minute' * time_window_minutes);
  
  RETURN current_count < max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;