-- Corrigir valores inválidos de visibility na tabela properties
UPDATE properties 
SET visibility = 'public_site' 
WHERE visibility NOT IN ('hidden', 'match_only', 'public_site');

-- Adicionar marketplace como valor válido no constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_visibility_check;
ALTER TABLE properties ADD CONSTRAINT properties_visibility_check 
CHECK (visibility = ANY (ARRAY['hidden'::text, 'match_only'::text, 'public_site'::text, 'marketplace'::text]));