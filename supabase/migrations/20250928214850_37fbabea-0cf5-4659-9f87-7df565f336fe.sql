-- 1.1 client_searches (usada por Minhas Buscas)
-- Garantir colunas essenciais (sem remover as que já existem)
ALTER TABLE public.client_searches
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS filters jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_client_searches_user ON public.client_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_client_searches_active ON public.client_searches(is_active);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_client_searches_updated') THEN
    CREATE TRIGGER tg_client_searches_updated
      BEFORE UPDATE ON public.client_searches
      FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.client_searches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_searches' AND policyname='client_searches_owner_all') THEN
    CREATE POLICY client_searches_owner_all ON public.client_searches
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 1.2 profiles (salvar Perfil)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_self_rw') THEN
    CREATE POLICY profiles_self_rw ON public.profiles
      FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- 1.3 minisite_configs (salvar configurações do minisite)
-- Garantir contrato
ALTER TABLE public.minisite_configs
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS title text DEFAULT 'Meu Minisite',
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#EF4444',
  ADD COLUMN IF NOT EXISTS template_id text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS show_properties boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_about boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS ux_minisite_configs_user ON public.minisite_configs(user_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_minisite_configs_updated_at') THEN
    CREATE TRIGGER tg_minisite_configs_updated_at
      BEFORE UPDATE ON public.minisite_configs
      FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;

ALTER TABLE public.minisite_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='minisite_configs' AND policyname='minisite_configs_owner_all') THEN
    CREATE POLICY minisite_configs_owner_all ON public.minisite_configs
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;