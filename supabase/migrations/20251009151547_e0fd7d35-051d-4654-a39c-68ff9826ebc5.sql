-- Índices para otimizar performance na tabela subscription_payments

-- Índice para busca rápida por asaas_payment_id (usado em upserts)
CREATE INDEX IF NOT EXISTS idx_subscription_payments_asaas_id 
ON subscription_payments(asaas_payment_id);

-- Índice para busca por broker + status (usado em listagens filtradas)
CREATE INDEX IF NOT EXISTS idx_subscription_payments_broker_status 
ON subscription_payments(broker_id, status);

-- Índice para busca por data de vencimento (usado em ordenações)
CREATE INDEX IF NOT EXISTS idx_subscription_payments_due_date 
ON subscription_payments(due_date DESC);

-- Índice composto para busca eficiente por broker + próximo vencimento
CREATE INDEX IF NOT EXISTS idx_subscription_payments_broker_due 
ON subscription_payments(broker_id, due_date DESC)
WHERE status IN ('pending', 'overdue');