-- Add unique constraint for source_portal and external_id combination
-- This enables upsert operations using these fields as conflict resolution

-- First, clean up any potential duplicates (keep the most recent)
DELETE FROM properties p1 
WHERE EXISTS (
  SELECT 1 FROM properties p2 
  WHERE p1.source_portal = p2.source_portal 
  AND p1.external_id = p2.external_id 
  AND p1.id > p2.id
  AND p1.source_portal IS NOT NULL 
  AND p1.external_id IS NOT NULL
);

-- Create unique constraint on source_portal and external_id
ALTER TABLE properties 
ADD CONSTRAINT properties_source_external_unique 
UNIQUE (source_portal, external_id);