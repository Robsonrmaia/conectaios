-- Tabela para gerenciar retry de webhooks
CREATE TABLE IF NOT EXISTS public.asaas_webhook_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.asaas_webhooks(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para cupons de desconto
CREATE TABLE IF NOT EXISTS public.asaas_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_value NUMERIC(10,2) CHECK (discount_value >= 0),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para histórico de uso de cupons
CREATE TABLE IF NOT EXISTS public.asaas_coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.asaas_coupons(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para histórico de assinaturas (múltiplos planos)
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de email
CREATE TABLE IF NOT EXISTS public.subscription_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_retries_webhook_id ON public.asaas_webhook_retries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_retries_success ON public.asaas_webhook_retries(success);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.asaas_coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.asaas_coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_broker ON public.asaas_coupon_usage(broker_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON public.subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_broker ON public.subscription_email_logs(broker_id);

-- RLS Policies
ALTER TABLE public.asaas_webhook_retries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_email_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver retries de webhooks
CREATE POLICY "Admins can view webhook retries"
ON public.asaas_webhook_retries FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins podem gerenciar cupons
CREATE POLICY "Admins can manage coupons"
ON public.asaas_coupons FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Todos podem ver cupons ativos
CREATE POLICY "Anyone can view active coupons"
ON public.asaas_coupons FOR SELECT
TO authenticated
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Brokers podem ver seu uso de cupons
CREATE POLICY "Brokers can view their coupon usage"
ON public.asaas_coupon_usage FOR SELECT
TO authenticated
USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Brokers podem ver seu histórico de assinaturas
CREATE POLICY "Brokers can view their subscription history"
ON public.subscription_history FOR SELECT
TO authenticated
USING (subscription_id IN (SELECT id FROM subscriptions WHERE profile_id = auth.uid()));

-- Brokers podem ver seus logs de email
CREATE POLICY "Brokers can view their email logs"
ON public.subscription_email_logs FOR SELECT
TO authenticated
USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all email logs"
ON public.subscription_email_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));