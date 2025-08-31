-- Adicionar código de referência único para propriedades
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reference_code TEXT UNIQUE;

-- Função para gerar código de referência
CREATE OR REPLACE FUNCTION generate_property_reference_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Atualizar propriedades existentes sem código
UPDATE properties 
SET reference_code = generate_property_reference_code()
WHERE reference_code IS NULL;

-- Trigger para gerar código automaticamente para novas propriedades
CREATE OR REPLACE FUNCTION set_property_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_code IS NULL THEN
    NEW.reference_code := generate_property_reference_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_reference_code_trigger
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_reference_code();