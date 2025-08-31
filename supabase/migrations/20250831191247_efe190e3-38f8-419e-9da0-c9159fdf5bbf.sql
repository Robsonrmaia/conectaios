-- Fix security linter issues

-- Fix function search path for all existing functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.cleanup_old_login_events() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.generate_referral_code() SET search_path = 'public';

-- Create improved has_role function with proper security
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'broker');

-- Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles role column to use enum and add default user role trigger
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  -- Assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign default role on user creation
DROP TRIGGER IF EXISTS assign_default_role_trigger ON auth.users;
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- Improve audit logging function with proper security
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action TEXT,
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    broker_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    (SELECT id FROM brokers WHERE user_id = auth.uid()),
    _action,
    _resource_type,
    _resource_id,
    _old_values,
    _new_values,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- Create function to check plan limits
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  _resource_type TEXT,
  _limit_column TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_count INTEGER;
  plan_limit INTEGER;
BEGIN
  -- Get current resource count for user
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE user_id = $1', _resource_type)
  INTO current_count
  USING auth.uid();
  
  -- Get plan limit
  SELECT COALESCE((
    SELECT (features->>_limit_column)::INTEGER
    FROM plans p
    JOIN brokers b ON b.plan_id = p.id
    WHERE b.user_id = auth.uid()
  ), 50) INTO plan_limit;
  
  RETURN current_count < plan_limit;
END;
$$;

-- Create match engine function
CREATE OR REPLACE FUNCTION public.find_property_matches(
  client_preferences JSONB
)
RETURNS TABLE (
  property_id UUID,
  match_score INTEGER,
  property_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    -- Simple scoring algorithm
    CASE 
      WHEN p.valor BETWEEN 
        COALESCE((client_preferences->>'min_price')::NUMERIC, 0) AND 
        COALESCE((client_preferences->>'max_price')::NUMERIC, 999999999)
      THEN 50
      ELSE 0
    END +
    CASE 
      WHEN p.area BETWEEN 
        COALESCE((client_preferences->>'min_area')::NUMERIC, 0) AND 
        COALESCE((client_preferences->>'max_area')::NUMERIC, 999999)
      THEN 30
      ELSE 0
    END +
    CASE 
      WHEN p.quartos = COALESCE((client_preferences->>'bedrooms')::INTEGER, p.quartos)
      THEN 20
      ELSE 0
    END AS match_score,
    row_to_json(p.*)::JSONB
  FROM properties p
  WHERE p.visibility IN ('match_only', 'public_site')
    AND p.user_id != auth.uid()
    AND p.is_public = true
  ORDER BY match_score DESC
  LIMIT 20;
END;
$$;