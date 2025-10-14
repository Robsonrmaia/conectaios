-- Migration: Sincronizar broker_id em minisite_configs
-- Objetivo: Preencher broker_id para registros antigos que só têm user_id

-- Atualizar broker_id para registros existentes que só têm user_id
UPDATE minisite_configs mc
SET broker_id = b.id
FROM brokers b
WHERE mc.user_id = b.user_id
  AND mc.broker_id IS NULL;

-- Adicionar índice para melhorar performance de busca por user_id
CREATE INDEX IF NOT EXISTS idx_minisite_configs_user_id 
ON minisite_configs(user_id);

-- Adicionar comentários explicativos
COMMENT ON COLUMN minisite_configs.broker_id IS 
  'FK para brokers.id - pode ser NULL em registros antigos, mas deve ser preenchido';
COMMENT ON COLUMN minisite_configs.user_id IS 
  'FK para auth.users.id - campo principal para busca (sempre preenchido)';