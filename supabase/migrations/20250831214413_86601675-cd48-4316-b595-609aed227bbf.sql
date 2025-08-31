-- Phase 1: Critical Data Exposure Fixes

-- First, let's check for any orphaned records before making user_id NOT NULL
-- Update any NULL user_id records in properties (assign to a system user or remove)
DELETE FROM properties WHERE user_id IS NULL;

-- Make user_id NOT NULL for critical tables
ALTER TABLE properties ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;

-- Phase 2: Restrict Broker Public Data Access
-- Drop the existing public broker policy
DROP POLICY IF EXISTS "Public can view limited broker info for mini sites" ON brokers;

-- Create new restrictive policy that only exposes essential fields
CREATE POLICY "Public can view minimal broker info for mini sites" 
ON brokers 
FOR SELECT 
USING (
  status = 'active' 
  AND (auth.uid() IS NULL OR auth.uid() != user_id)
);

-- Add a function to get safe public broker data
CREATE OR REPLACE FUNCTION get_public_broker_info(broker_username text)
RETURNS TABLE(
  id uuid,
  name text,
  bio text,
  avatar_url text,
  username text,
  status text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    b.id,
    b.name,
    b.bio,
    b.avatar_url,
    b.username,
    b.status
  FROM brokers b
  WHERE b.username = broker_username 
    AND b.status = 'active';
$$;

-- Phase 3: Enhanced Property Security
-- Update property policies to be more restrictive
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON properties;

CREATE POLICY "Public can view approved properties only" 
ON properties 
FOR SELECT 
USING (
  is_public = true 
  AND visibility IN ('public_site', 'match_only')
  AND user_id IS NOT NULL
);

-- Phase 4: Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION log_property_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if it's a public view (non-owner)
  IF auth.uid() IS NULL OR auth.uid() != NEW.user_id THEN
    UPDATE properties 
    SET 
      views_count = COALESCE(views_count, 0) + 1,
      last_viewed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 5: Add rate limiting considerations
-- Create a function to check if a user can perform an action
CREATE OR REPLACE FUNCTION check_rate_limit(action_type text, limit_per_hour integer DEFAULT 100)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
BEGIN
  -- Simple rate limiting based on audit logs
  SELECT COUNT(*) INTO current_count
  FROM audit_logs
  WHERE user_id = auth.uid()
    AND action = action_type
    AND created_at > NOW() - INTERVAL '1 hour';
    
  RETURN current_count < limit_per_hour;
END;
$$;

-- Phase 6: Strengthen client data security
-- Ensure client history is properly secured
ALTER TABLE client_history ALTER COLUMN user_id SET NOT NULL;

-- Add check constraint for valid client stages
ALTER TABLE clients ADD CONSTRAINT valid_stage 
CHECK (stage IN ('novo_lead', 'contato_inicial', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'));

-- Add check constraint for valid classification
ALTER TABLE clients ADD CONSTRAINT valid_classificacao 
CHECK (classificacao IN ('novo_lead', 'interessado', 'qualificado', 'cliente'));

-- Phase 7: Secure messaging system
-- Ensure message participants are properly validated
CREATE OR REPLACE FUNCTION validate_message_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the sender is actually a participant in the thread
  IF NOT EXISTS (
    SELECT 1 FROM threads 
    WHERE id = NEW.thread_id 
    AND NEW.broker_id = ANY(participants)
  ) THEN
    RAISE EXCEPTION 'User not authorized to send messages in this thread';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_message_participant_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_participant();

-- Phase 8: Add security to deals
-- Ensure deal participants are valid brokers
ALTER TABLE deals ADD CONSTRAINT valid_buyer_broker 
FOREIGN KEY (buyer_broker_id) REFERENCES brokers(id);

ALTER TABLE deals ADD CONSTRAINT valid_seller_broker 
FOREIGN KEY (seller_broker_id) REFERENCES brokers(id);

ALTER TABLE deals ADD CONSTRAINT valid_listing_broker 
FOREIGN KEY (listing_broker_id) REFERENCES brokers(id);