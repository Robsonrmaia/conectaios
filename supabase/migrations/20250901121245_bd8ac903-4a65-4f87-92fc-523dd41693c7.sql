-- Create function to find property matches for the match engine
CREATE OR REPLACE FUNCTION find_property_matches(client_preferences JSONB)
RETURNS TABLE (
  property_id UUID,
  match_score INTEGER,
  property_data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
  FROM properties p
  WHERE p.is_public = true 
    AND p.visibility = 'public_site'
    AND p.user_id != auth.uid()
  ORDER BY match_score DESC
  LIMIT 50;
END;
$$;

-- Create function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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
      SELECT 1 FROM conectaios_brokers WHERE referral_code = new_code
    ) INTO exists;
    
    -- If code doesn't exist, we can use it
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update the brokers table to ensure RLS policies are correct for insertions
CREATE POLICY "Service role can insert brokers"
ON conectaios_brokers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow brokers to create their own profile
CREATE POLICY "Users can create their broker profile"
ON conectaios_brokers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_visibility ON properties(visibility, is_public, user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_username ON conectaios_brokers(username);
CREATE INDEX IF NOT EXISTS idx_brokers_referral_code ON conectaios_brokers(referral_code);

-- Add missing columns to threads table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'threads' AND column_name = 'created_by') THEN
    ALTER TABLE threads ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create function for real-time notifications
CREATE OR REPLACE FUNCTION notify_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_notify_message_insert ON messages;
CREATE TRIGGER trigger_notify_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_insert();

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_property_matches(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated, service_role;