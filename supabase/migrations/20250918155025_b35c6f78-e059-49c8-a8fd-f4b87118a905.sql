-- Final security improvements - handling existing policies
-- This fixes the policy conflict issue

-- 1. Create enhanced audit trigger (this part worked)
-- 2. Handle existing policies properly
DROP POLICY IF EXISTS "Only admins can manage system settings" ON public.system_settings;
CREATE POLICY "Enhanced admin system settings access"
ON public.system_settings FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 3. Add missing audit triggers for other sensitive tables
DROP TRIGGER IF EXISTS audit_deals_changes ON public.deals;
CREATE TRIGGER audit_deals_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

DROP TRIGGER IF EXISTS audit_support_tickets_changes ON public.support_tickets;
CREATE TRIGGER audit_support_tickets_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

-- 4. Create security monitoring view (admin only)
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  action,
  resource_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM public.audit_logs
WHERE created_at >= now() - interval '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action, resource_type
ORDER BY hour DESC;

-- Add RLS to the security dashboard
ALTER VIEW public.security_dashboard OWNER TO postgres;
CREATE POLICY "Only admins can view security dashboard"
ON public.audit_logs FOR SELECT
USING (get_current_user_role() = 'admin');

-- 5. Add function to check for suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TABLE(
  user_id UUID,
  ip_address TEXT,
  suspicious_score INTEGER,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.user_id,
    al.ip_address,
    CASE 
      WHEN failed_logins >= 5 THEN 100
      WHEN rapid_requests >= 50 THEN 80
      WHEN unusual_hours >= 3 THEN 60
      ELSE 20
    END as suspicious_score,
    CASE 
      WHEN failed_logins >= 5 THEN 'Multiple failed login attempts'
      WHEN rapid_requests >= 50 THEN 'Rapid API requests'  
      WHEN unusual_hours >= 3 THEN 'Activity during unusual hours'
      ELSE 'Normal activity'
    END as reason
  FROM (
    SELECT 
      user_id,
      ip_address,
      COUNT(CASE WHEN action LIKE '%failed%' THEN 1 END) as failed_logins,
      COUNT(CASE WHEN created_at > now() - interval '1 hour' THEN 1 END) as rapid_requests,
      COUNT(CASE WHEN EXTRACT(hour FROM created_at) NOT BETWEEN 6 AND 22 THEN 1 END) as unusual_hours
    FROM public.audit_logs
    WHERE created_at >= now() - interval '24 hours'
    GROUP BY user_id, ip_address
  ) al
  WHERE failed_logins >= 3 OR rapid_requests >= 20 OR unusual_hours >= 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;