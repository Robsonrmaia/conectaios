-- Fix RLS policy for threads table to allow broker insertions
DROP POLICY IF EXISTS "Brokers can access threads they participate in" ON threads;

-- Create new comprehensive RLS policies for threads
CREATE POLICY "Brokers can read threads they participate in" 
ON threads FOR SELECT
USING (
  ( SELECT brokers.id FROM conectaios_brokers brokers WHERE brokers.user_id = auth.uid() ) = ANY (participants)
);

CREATE POLICY "Brokers can insert threads for themselves" 
ON threads FOR INSERT
WITH CHECK (
  created_by = ( SELECT brokers.id FROM conectaios_brokers brokers WHERE brokers.user_id = auth.uid() )
  AND 
  ( SELECT brokers.id FROM conectaios_brokers brokers WHERE brokers.user_id = auth.uid() ) = ANY (participants)
);

CREATE POLICY "Brokers can update their threads" 
ON threads FOR UPDATE
USING (
  ( SELECT brokers.id FROM conectaios_brokers brokers WHERE brokers.user_id = auth.uid() ) = ANY (participants)
);

CREATE POLICY "Brokers can delete threads they created" 
ON threads FOR DELETE
USING (
  created_by = ( SELECT brokers.id FROM conectaios_brokers brokers WHERE brokers.user_id = auth.uid() )
);