-- Adicionar novos campos opcionais à tabela clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS indicacao TEXT,
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.clients.endereco IS 'Endereço completo do cliente (rua, número, bairro)';
COMMENT ON COLUMN public.clients.cidade IS 'Cidade de residência';
COMMENT ON COLUMN public.clients.estado IS 'UF (sigla do estado)';
COMMENT ON COLUMN public.clients.cep IS 'CEP do cliente';
COMMENT ON COLUMN public.clients.indicacao IS 'Como o cliente conheceu o corretor (fonte/indicação)';
COMMENT ON COLUMN public.clients.profissao IS 'Profissão do cliente';
COMMENT ON COLUMN public.clients.estado_civil IS 'Estado civil: solteiro, casado, divorciado, viuvo, uniao_estavel';
COMMENT ON COLUMN public.clients.observacoes IS 'Observações gerais sobre o cliente';