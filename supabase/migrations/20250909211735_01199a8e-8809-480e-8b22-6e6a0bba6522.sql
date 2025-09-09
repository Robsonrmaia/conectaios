-- Update the banner_type constraint to include 'abaixo_mercado'
ALTER TABLE conectaios_properties 
DROP CONSTRAINT IF EXISTS conectaios_properties_banner_type_check;

ALTER TABLE conectaios_properties 
ADD CONSTRAINT conectaios_properties_banner_type_check 
CHECK (banner_type IN ('vendido', 'alugado', 'oportunidade', 'exclusivo', 'abaixo_mercado'));