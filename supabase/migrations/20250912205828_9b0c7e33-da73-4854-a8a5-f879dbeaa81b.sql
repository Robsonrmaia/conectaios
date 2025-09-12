-- Add new fields for property features
ALTER TABLE public.properties 
ADD COLUMN furnishing_type TEXT DEFAULT 'none' CHECK (furnishing_type IN ('none', 'furnished', 'semi_furnished')),
ADD COLUMN sea_distance INTEGER DEFAULT NULL;

-- Add comments for better documentation
COMMENT ON COLUMN public.properties.furnishing_type IS 'Tipo de mobília: none, furnished, semi_furnished';
COMMENT ON COLUMN public.properties.sea_distance IS 'Distância do mar em metros';