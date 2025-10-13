-- Criar tabela pending_signups para armazenar dados de assinaturas pendentes
CREATE TABLE IF NOT EXISTS pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  cpf_cnpj TEXT,
  plan_id TEXT NOT NULL,
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  external_reference TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_external_ref ON pending_signups(external_reference);
CREATE INDEX IF NOT EXISTS idx_pending_signups_payment_status ON pending_signups(payment_status);
CREATE INDEX IF NOT EXISTS idx_pending_signups_asaas_customer ON pending_signups(asaas_customer_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pending_signups ENABLE ROW LEVEL SECURITY;

-- Política para permitir insert público (necessário para o fluxo de checkout)
CREATE POLICY "Permitir insert público de pending_signups"
ON pending_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política para admins visualizarem todas as pending_signups
CREATE POLICY "Admins podem visualizar pending_signups"
ON pending_signups
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER set_pending_signups_updated_at
  BEFORE UPDATE ON pending_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();