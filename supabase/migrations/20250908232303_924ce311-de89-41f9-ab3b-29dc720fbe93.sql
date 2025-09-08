-- Create asaas_webhooks table for logging webhooks
CREATE TABLE IF NOT EXISTS public.asaas_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT,
  payment_id TEXT,
  payment_status TEXT,
  payment_value NUMERIC,
  customer_id TEXT,
  external_reference TEXT,
  webhook_data JSONB
);

-- Enable RLS
ALTER TABLE public.asaas_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy to allow insert via service role (webhooks)
CREATE POLICY "allow_webhook_insert" ON public.asaas_webhooks
FOR INSERT 
USING (true) 
WITH CHECK (true);

-- Add cpf_cnpj field to conectaios_brokers table
ALTER TABLE public.conectaios_brokers 
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;