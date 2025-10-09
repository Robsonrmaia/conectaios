-- ============================================
-- FASE 2: CONTROLE DE ACESSO - SUBSCRIPTION STATUS HISTORY
-- ============================================

-- Tabela para log de mudanças de status de assinatura
CREATE TABLE IF NOT EXISTS public.subscription_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by TEXT DEFAULT 'system' -- 'system', 'webhook', 'admin', 'manual'
);

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_subscription_status_history_broker 
ON public.subscription_status_history(broker_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_status_history_new_status 
ON public.subscription_status_history(new_status, changed_at DESC);

-- Habilitar RLS
ALTER TABLE public.subscription_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers podem ver seu próprio histórico
CREATE POLICY "Brokers can view their own status history"
ON public.subscription_status_history
FOR SELECT
TO authenticated
USING (broker_id IN (
  SELECT id FROM public.brokers WHERE user_id = auth.uid()
));

-- Policy: Admins podem ver tudo
CREATE POLICY "Admins can view all status history"
ON public.subscription_status_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Função para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.log_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o status realmente mudou
  IF OLD.subscription_status IS DISTINCT FROM NEW.subscription_status THEN
    INSERT INTO public.subscription_status_history (
      broker_id, 
      old_status, 
      new_status, 
      reason, 
      changed_by
    ) VALUES (
      NEW.id,
      OLD.subscription_status,
      NEW.subscription_status,
      'Automated status change',
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para log automático em brokers
DROP TRIGGER IF EXISTS trigger_log_subscription_status ON public.brokers;
CREATE TRIGGER trigger_log_subscription_status
AFTER UPDATE ON public.brokers
FOR EACH ROW
EXECUTE FUNCTION public.log_subscription_status_change();

-- Comentários para documentação
COMMENT ON TABLE public.subscription_status_history IS 'Log de mudanças de status de assinatura para auditoria';
COMMENT ON COLUMN public.subscription_status_history.changed_by IS 'Origem da mudança: system, webhook, admin, manual';
COMMENT ON FUNCTION public.log_subscription_status_change() IS 'Registra automaticamente mudanças de subscription_status na tabela brokers';