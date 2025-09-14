-- Add tour_360_url field to conectaios_properties table
ALTER TABLE public.conectaios_properties 
ADD COLUMN tour_360_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.conectaios_properties.tour_360_url IS 'URL for 360 degree tour generated from property photos';