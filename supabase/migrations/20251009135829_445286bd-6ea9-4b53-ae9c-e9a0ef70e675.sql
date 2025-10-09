-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  asaas_payment_id TEXT UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'overdue', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'boleto')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  invoice_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_subscription_payments_broker_id ON public.subscription_payments(broker_id);
CREATE INDEX idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX idx_subscription_payments_due_date ON public.subscription_payments(due_date DESC);

-- Enable RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers can view their own payments
CREATE POLICY "Brokers can view their own payments"
ON public.subscription_payments
FOR SELECT
USING (
  broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.subscription_payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();