-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION generate_property_reference_code()
RETURNS TEXT 
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
    IF NOT EXISTS (SELECT 1 FROM properties WHERE reference_code = code) THEN
      EXIT;
    END IF;
    
    counter := counter + 1;
  END LOOP;
  
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION set_property_reference_code()
RETURNS TRIGGER 
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