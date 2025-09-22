-- Update imported CNM properties to have correct visibility settings
UPDATE properties 
SET 
  is_public = true,
  visibility = 'public_site',
  broker_minisite_enabled = true
WHERE source_portal = 'cnm' 
  AND is_public = false;