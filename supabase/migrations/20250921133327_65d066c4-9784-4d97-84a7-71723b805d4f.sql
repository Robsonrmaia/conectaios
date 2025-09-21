-- Adicionar 'both' como valor válido no constraint de visibility
ALTER TABLE properties DROP CONSTRAINT properties_visibility_check;
ALTER TABLE properties ADD CONSTRAINT properties_visibility_check 
CHECK (visibility = ANY (ARRAY['hidden'::text, 'match_only'::text, 'public_site'::text, 'marketplace'::text, 'both'::text]));