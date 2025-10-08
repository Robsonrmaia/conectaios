-- Criar tabela para armazenar signups pendentes de vinculação
CREATE TABLE public.pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  cpf_cnpj TEXT,
  plan_id TEXT NOT NULL,
  asaas_customer_id TEXT,
  asaas_payment_id TEXT,
  asaas_subscription_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  external_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  claimed_by_user_id UUID REFERENCES auth.users(id)
);

-- RLS: Apenas admins podem ver signups pendentes
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pending signups"
ON public.pending_signups
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create pending signup"
ON public.pending_signups
FOR INSERT
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_pending_signups_email ON public.pending_signups(email);
CREATE INDEX idx_pending_signups_external_ref ON public.pending_signups(external_reference);
CREATE INDEX idx_pending_signups_claimed ON public.pending_signups(claimed) WHERE NOT claimed;