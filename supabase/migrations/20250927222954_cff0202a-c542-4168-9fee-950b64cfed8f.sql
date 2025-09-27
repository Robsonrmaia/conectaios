-- ADMIN oficial simples (sem conflitos)
DO $$
DECLARE
  v_user uuid;
BEGIN
  SELECT id INTO v_user FROM auth.users WHERE email = 'social.conectaios@gmail.com';
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Crie primeiro o usuário social.conectaios@gmail.com no Auth.';
  END IF;

  -- profiles: usa o mesmo id do auth.users
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (v_user, 'social.conectaios@gmail.com', 'Admin', 'admin'::user_role)
  ON CONFLICT (id) DO UPDATE
    SET role = 'admin'::user_role, name = 'Admin';

  -- Verificar se já existe broker para este user
  IF NOT EXISTS (SELECT 1 FROM public.brokers WHERE user_id = v_user) THEN
    INSERT INTO public.brokers (id, user_id, creci)
    VALUES (gen_random_uuid(), v_user, 'ADMIN');
  END IF;

  -- minisite_configs padrão
  INSERT INTO public.minisite_configs (user_id, title)
  VALUES (v_user, 'ConectaIOS Admin')
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- CLIENT_HISTORY (tabela para histórico de clientes)
CREATE TABLE IF NOT EXISTS public.client_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.crm_clients(id),
  action text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- RLS para client_history
ALTER TABLE public.client_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their client history" ON public.client_history;
CREATE POLICY "Users can manage their client history" ON public.client_history
  FOR ALL USING (auth.uid() = user_id);

-- MARKET_STATS (tabela para estatísticas de mercado)
CREATE TABLE IF NOT EXISTS public.market_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  property_type text,
  listing_type text,
  avg_price numeric,
  total_listings integer DEFAULT 0,
  avg_days_on_market integer DEFAULT 0,
  price_per_sqm numeric,
  region text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS para market_stats
ALTER TABLE public.market_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Market stats are public for reading" ON public.market_stats;
CREATE POLICY "Market stats are public for reading" ON public.market_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage market stats" ON public.market_stats;
CREATE POLICY "Only admins can manage market stats" ON public.market_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
    )
  );