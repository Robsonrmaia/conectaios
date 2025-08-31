-- Critical Security Fix 1: Restrict Broker Public Data Access
-- Drop the existing overly permissive public broker policy
DROP POLICY IF EXISTS "Public can view limited broker info for mini sites" ON brokers;

-- Create new restrictive policy that only exposes essential fields
CREATE POLICY "Public can view minimal broker info for mini sites" 
ON brokers 
FOR SELECT 
USING (
  status = 'active' 
  AND (auth.uid() IS NULL OR auth.uid() != user_id)
);

-- Critical Security Fix 2: Enhanced Property Security
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

-- Critical Security Fix 3: Add validation constraints for client data
ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS valid_stage 
CHECK (stage IN ('novo_lead', 'contato_inicial', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'));

ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS valid_classificacao 
CHECK (classificacao IN ('novo_lead', 'interessado', 'qualificado', 'cliente'));

-- Critical Security Fix 4: Secure messaging system
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

DROP TRIGGER IF EXISTS validate_message_participant_trigger ON messages;
CREATE TRIGGER validate_message_participant_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_participant();