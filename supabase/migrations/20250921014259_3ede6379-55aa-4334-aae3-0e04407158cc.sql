-- Adicionar campo verified na tabela properties para marcação de verificação
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Criar índice para melhor performance nas consultas de verificação
CREATE INDEX IF NOT EXISTS idx_properties_verified ON properties(verified);

-- Adicionar comentário para documentação
COMMENT ON COLUMN properties.verified IS 'Indica se o imóvel foi verificado/aprovado pelos administradores';