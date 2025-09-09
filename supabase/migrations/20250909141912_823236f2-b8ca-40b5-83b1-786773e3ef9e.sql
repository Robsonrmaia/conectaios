-- Add new fields to conectaios_properties table
ALTER TABLE conectaios_properties 
ADD COLUMN banner_type TEXT CHECK (banner_type IN ('vendido', 'alugado', 'oportunidade', 'exclusivo')),
ADD COLUMN is_furnished BOOLEAN DEFAULT false,
ADD COLUMN has_sea_view BOOLEAN DEFAULT false,
ADD COLUMN watermark_enabled BOOLEAN DEFAULT true;