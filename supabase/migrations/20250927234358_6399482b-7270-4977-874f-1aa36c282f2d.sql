-- Adicionar campos faltantes na tabela brokers
ALTER TABLE public.brokers 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS plan_id UUID,
ADD COLUMN IF NOT EXISTS region_id TEXT;

-- Adicionar campos faltantes na tabela plans
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS match_limit INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS thread_limit INTEGER DEFAULT 50;

-- Criar tabela user_onboarding
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tour_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS na tabela user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Criar política para user_onboarding
CREATE POLICY "Users can manage their own onboarding" 
ON public.user_onboarding 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Adicionar campos faltantes na tabela support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Adicionar campos faltantes na tabela minisite_configs
ALTER TABLE public.minisite_configs 
ADD COLUMN IF NOT EXISTS show_contact_form BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS broker_id UUID,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS config_data JSONB DEFAULT '{}';

-- Adicionar trigger para updated_at na user_onboarding
CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();