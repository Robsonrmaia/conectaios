-- Adicionar colunas para o fluxo de signup com token
ALTER TABLE pending_signups 
ADD COLUMN IF NOT EXISTS signup_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_pending_signups_token 
ON pending_signups(signup_token) 
WHERE signup_token IS NOT NULL;

-- Comentários explicativos
COMMENT ON COLUMN pending_signups.signup_token IS 'Token único enviado por email para o usuário completar o cadastro';
COMMENT ON COLUMN pending_signups.token_expires_at IS 'Data de expiração do token (48 horas após criação)';