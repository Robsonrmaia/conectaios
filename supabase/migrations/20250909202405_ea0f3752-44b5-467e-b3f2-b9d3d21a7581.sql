-- Fix remaining security issues from linter

-- 1. Fix Function Search Path issues - update functions without proper search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_login_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_plan_limit(_resource_type text, _limit_column text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.ensure_admin_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_user_id uuid;
    result json;
BEGIN
    -- Check if admin profile already exists
    SELECT user_id INTO admin_user_id
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        result := json_build_object(
            'success', true,
            'message', 'Admin profile already exists',
            'user_id', admin_user_id,
            'email', 'admin@conectaios.com.br',
            'password', 'admin123'
        );
        RETURN result;
    END IF;
    
    -- Create admin profile with specific UUID that matches auth user
    admin_user_id := '118c5166-0430-4c27-a04d-1775a5d83acd'::uuid;
    
    INSERT INTO profiles (user_id, nome, role)
    VALUES (
        admin_user_id,
        'Administrador Sistema',
        'admin'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        nome = 'Administrador Sistema';
    
    result := json_build_object(
        'success', true,
        'message', 'Admin profile created successfully',
        'user_id', admin_user_id,
        'email', 'admin@conectaios.com.br',
        'password', 'admin123'
    );
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_property_reference_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    code := 'CO' || LPAD(counter::TEXT, 5, '0');
    
    -- Verificar se o código já existe
    IF NOT EXISTS (SELECT 1 FROM conectaios_properties WHERE reference_code = code) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
  END LOOP;
  
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_property_reference_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_code IS NULL THEN
    NEW.reference_code := generate_property_reference_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify about new message
  PERFORM pg_notify(
    'message_inserted',
    json_build_object(
      'thread_id', NEW.thread_id,
      'sender_name', NEW.sender_name,
      'content', NEW.content
    )::text
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_property_matches(client_preferences jsonb)
RETURNS TABLE(property_id uuid, match_score integer, property_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as property_id,
    CASE 
      WHEN p.valor BETWEEN (client_preferences->>'min_price')::NUMERIC AND (client_preferences->>'max_price')::NUMERIC THEN 80
      WHEN p.area BETWEEN (client_preferences->>'min_area')::NUMERIC AND (client_preferences->>'max_area')::NUMERIC THEN 70
      WHEN p.quartos = (client_preferences->>'bedrooms')::INTEGER THEN 90
      WHEN p.property_type = (client_preferences->>'property_type')::TEXT THEN 60
      ELSE 40
    END as match_score,
    row_to_json(p)::JSONB as property_data
  FROM public.properties p
  WHERE p.is_public = true 
    AND p.visibility = 'public_site'
    AND p.user_id != auth.uid()
  ORDER BY match_score DESC
  LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.conectaios_brokers WHERE referral_code = new_code
    ) INTO exists;
    
    -- If code doesn't exist, we can use it
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;