-- Add missing fields to conectaios_properties table
ALTER TABLE public.conectaios_properties 
ADD COLUMN furnishing_type TEXT DEFAULT 'none',
ADD COLUMN sea_distance INTEGER;

-- Update the trigger to handle these new fields
CREATE OR REPLACE FUNCTION public.update_conectaios_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS update_conectaios_properties_updated_at ON public.conectaios_properties;
CREATE TRIGGER update_conectaios_properties_updated_at
  BEFORE UPDATE ON public.conectaios_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conectaios_properties_updated_at();