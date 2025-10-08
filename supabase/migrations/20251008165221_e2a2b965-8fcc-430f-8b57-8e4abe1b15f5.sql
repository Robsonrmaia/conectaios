-- ========================================
-- FASE 1: Estrutura do Banco de Dados para Asaas (CORRIGIDA)
-- ========================================

-- 1. Criar tabela de webhooks do Asaas
CREATE TABLE IF NOT EXISTS public.asaas_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  payment jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamp with time zone,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON public.asaas_webhooks(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event ON public.asaas_webhooks(event);

ALTER TABLE public.asaas_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view webhooks" ON public.asaas_webhooks;
CREATE POLICY "Admins can view webhooks"
ON public.asaas_webhooks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));


-- 2. Criar tabela de customers do Asaas (relacionada a brokers)
CREATE TABLE IF NOT EXISTS public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  asaas_customer_id text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(broker_id)
);

CREATE INDEX IF NOT EXISTS idx_asaas_customers_broker ON public.asaas_customers(broker_id);
CREATE INDEX IF NOT EXISTS idx_asaas_customers_asaas_id ON public.asaas_customers(asaas_customer_id);

ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can view own customer" ON public.asaas_customers;
CREATE POLICY "Brokers can view own customer"
ON public.asaas_customers
FOR SELECT
TO authenticated
USING (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Brokers can insert own customer" ON public.asaas_customers;
CREATE POLICY "Brokers can insert own customer"
ON public.asaas_customers
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);


-- 3. Adicionar colunas na tabela brokers
ALTER TABLE public.brokers 
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zipcode text;

CREATE INDEX IF NOT EXISTS idx_brokers_asaas_customer ON public.brokers(asaas_customer_id);


-- 4. Atualizar tabela subscriptions (profile_id já existe)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS next_billing_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE status = 'active';


-- 5. Criar função para sincronizar broker quando subscription muda
-- Nota: subscriptions.profile_id = auth.users.id = brokers.user_id
CREATE OR REPLACE FUNCTION public.sync_broker_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar dados do broker baseado na subscription
  -- profile_id na subscriptions = user_id no brokers
  UPDATE public.brokers
  SET 
    subscription_status = NEW.status,
    subscription_expires_at = NEW.next_billing_date,
    plan_id = NEW.plan_id,
    updated_at = now()
  WHERE user_id = NEW.profile_id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS trigger_sync_broker_subscription ON public.subscriptions;
CREATE TRIGGER trigger_sync_broker_subscription
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_broker_subscription();


-- 6. Atualizar RLS da tabela subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Brokers can view own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscriptions;
CREATE POLICY "System can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscriptions;
CREATE POLICY "System can update subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (true);


-- ========================================
-- FIM DA MIGRATION - FASE 1 COMPLETA
-- ========================================