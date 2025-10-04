-- Adicionar coluna reference_code (único por corretor)
ALTER TABLE imoveis 
ADD COLUMN IF NOT EXISTS reference_code TEXT;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_imoveis_reference_code 
ON imoveis(owner_id, reference_code);

-- Criar constraint de unicidade por corretor
ALTER TABLE imoveis 
DROP CONSTRAINT IF EXISTS unique_reference_code_per_owner;

ALTER TABLE imoveis 
ADD CONSTRAINT unique_reference_code_per_owner 
UNIQUE (owner_id, reference_code);

-- Função para gerar código automático "COxxxxx"
CREATE OR REPLACE FUNCTION generate_reference_code(p_owner_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_next_number INT;
  v_code TEXT;
BEGIN
  -- Buscar o próximo número disponível para este corretor
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(reference_code, '[^0-9]', '', 'g') AS INT
    )
  ), 0) + 1
  INTO v_next_number
  FROM imoveis
  WHERE owner_id = p_owner_id
    AND reference_code ~ '^CO[0-9]+$';
  
  -- Formatar como "COxxxxx" (5 dígitos com zeros à esquerda)
  v_code := 'CO' || LPAD(v_next_number::TEXT, 5, '0');
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente se não fornecido
CREATE OR REPLACE FUNCTION set_reference_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Se reference_code não foi fornecido ou é vazio
  IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
    -- Se tem external_id (importado XML), usar ele
    IF NEW.external_id IS NOT NULL AND NEW.external_id != '' THEN
      NEW.reference_code := NEW.external_id;
    ELSE
      -- Gerar código automático "COxxxxx"
      NEW.reference_code := generate_reference_code(NEW.owner_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_set_reference_code ON imoveis;
CREATE TRIGGER trigger_set_reference_code
  BEFORE INSERT ON imoveis
  FOR EACH ROW
  EXECUTE FUNCTION set_reference_code();

-- Gerar códigos para imóveis existentes usando CTE
WITH numbered_properties AS (
  SELECT 
    id,
    owner_id,
    external_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at) as row_num
  FROM imoveis
  WHERE reference_code IS NULL OR reference_code = ''
)
UPDATE imoveis
SET reference_code = CASE
  WHEN np.external_id IS NOT NULL AND np.external_id != '' THEN np.external_id
  ELSE 'CO' || LPAD(np.row_num::TEXT, 5, '0')
END
FROM numbered_properties np
WHERE imoveis.id = np.id;