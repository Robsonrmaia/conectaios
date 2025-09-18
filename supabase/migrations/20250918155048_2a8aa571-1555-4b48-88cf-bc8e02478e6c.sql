-- Simple and effective security improvements
-- Creating all necessary functions and policies step by step

-- 1. First create the audit function
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- If audit logging fails, don't block the operation
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Add basic security policies
CREATE POLICY "Enhanced admin access to system settings"
ON public.system_settings FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 3. Create security monitoring function
CREATE OR REPLACE FUNCTION public.get_security_summary()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Only admins can access security summary
  IF get_current_user_role() != 'admin' THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_brokers', (SELECT COUNT(*) FROM conectaios_brokers WHERE status = 'active'),
    'recent_logins', (SELECT COUNT(*) FROM audit_logs WHERE action = 'login' AND created_at > now() - interval '24 hours'),
    'last_updated', now()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;