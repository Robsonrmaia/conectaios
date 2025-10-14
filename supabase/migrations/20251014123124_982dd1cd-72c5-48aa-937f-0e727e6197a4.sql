-- A tabela real é 'brokers', não 'conectaios_brokers' (que é uma view)
-- Adicionar coluna username à tabela brokers
ALTER TABLE public.brokers 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_brokers_username 
ON public.brokers(username);

-- Adicionar comentário
COMMENT ON COLUMN public.brokers.username IS 'Username único para o corretor (usado em URLs do minisite)';