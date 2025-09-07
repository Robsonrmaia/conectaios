-- Add email and data_nascimento fields to conectaios_clients table
ALTER TABLE conectaios_clients 
ADD COLUMN email TEXT,
ADD COLUMN data_nascimento DATE;

-- Create client_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES conectaios_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on client_history
ALTER TABLE client_history ENABLE ROW LEVEL SECURITY;

-- Create policy for client_history
CREATE POLICY "Users can manage client history for their clients" 
ON client_history 
FOR ALL 
USING (client_id IN (
  SELECT id FROM conectaios_clients WHERE user_id = auth.uid()
));

-- Add marketplace_visibility field to conectaios_properties table for 3-level system
ALTER TABLE conectaios_properties 
ADD COLUMN marketplace_visibility TEXT DEFAULT 'private' CHECK (marketplace_visibility IN ('private', 'public_site', 'marketplace'));

-- Update existing properties to have public_site visibility if they were public
UPDATE conectaios_properties 
SET marketplace_visibility = 'public_site' 
WHERE is_public = true AND visibility = 'public_site';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_history_client_id ON client_history(client_id);
CREATE INDEX IF NOT EXISTS idx_client_history_created_at ON client_history(created_at);
CREATE INDEX IF NOT EXISTS idx_conectaios_clients_email ON conectaios_clients(email);
CREATE INDEX IF NOT EXISTS idx_conectaios_clients_data_nascimento ON conectaios_clients(data_nascimento);
CREATE INDEX IF NOT EXISTS idx_conectaios_properties_marketplace_visibility ON conectaios_properties(marketplace_visibility);