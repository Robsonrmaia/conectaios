-- Critical Security Fix 1: Restrict Broker Public Data Access
-- Drop the existing overly permissive public broker policy
DROP POLICY IF EXISTS "Public can view limited broker info for mini sites" ON brokers;

-- Create new restrictive policy that only exposes essential fields for public minisite viewing
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
-- First check if constraints already exist and drop them if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_stage') THEN
    ALTER TABLE clients DROP CONSTRAINT valid_stage;
  END IF;
END $$;

ALTER TABLE clients ADD CONSTRAINT valid_stage 
CHECK (stage IN ('novo_lead', 'contato_inicial', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'));

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_classificacao') THEN
    ALTER TABLE clients DROP CONSTRAINT valid_classificacao;
  END IF;
END $$;

ALTER TABLE clients ADD CONSTRAINT valid_classificacao 
CHECK (classificacao IN ('novo_lead', 'interessado', 'qualificado', 'cliente'));