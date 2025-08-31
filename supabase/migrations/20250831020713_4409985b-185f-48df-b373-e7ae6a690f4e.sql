-- Update properties table structure to match new schema
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parking_spots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'venda',
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartamento';

-- Update existing properties with default values
UPDATE public.properties 
SET 
  bathrooms = 1,
  parking_spots = 1,
  listing_type = 'venda',
  property_type = 'apartamento'
WHERE bathrooms IS NULL;