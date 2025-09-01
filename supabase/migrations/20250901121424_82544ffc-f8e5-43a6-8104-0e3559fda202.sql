-- Fix function search path security issues by properly dropping dependencies first
DROP TRIGGER IF EXISTS trigger_notify_message_insert ON public.messages CASCADE;
DROP FUNCTION IF EXISTS notify_message_insert() CASCADE;
DROP FUNCTION IF EXISTS find_property_matches(JSONB) CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION public.find_property_matches(client_preferences JSONB)
RETURNS TABLE (
  property_id UUID,
  match_score INTEGER,
  property_data JSONB
) 
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
RETURNS TEXT
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

-- Recreate trigger
CREATE TRIGGER trigger_notify_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_insert();

-- Grant permissions with explicit schema
GRANT EXECUTE ON FUNCTION public.find_property_matches(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated, service_role;