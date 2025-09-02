-- Create function to generate property reference code
CREATE OR REPLACE FUNCTION public.generate_property_reference_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    code := 'CO' || LPAD(counter::TEXT, 5, '0');
    
    -- Verificar se o código já existe
    IF NOT EXISTS (SELECT 1 FROM conectaios_properties WHERE reference_code = code) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create trigger function to set property reference code
CREATE OR REPLACE FUNCTION public.set_property_reference_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_code IS NULL THEN
    NEW.reference_code := generate_property_reference_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on conectaios_properties table
DROP TRIGGER IF EXISTS trigger_set_property_reference_code ON conectaios_properties;
CREATE TRIGGER trigger_set_property_reference_code
  BEFORE INSERT ON conectaios_properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_reference_code();