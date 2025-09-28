-- ===== util: trigger genérico updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ===== PROFILES (perfil salva)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_self_rw') THEN
    CREATE POLICY profiles_self_rw
    ON public.profiles FOR ALL
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_profiles_updated') THEN
    CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;

-- ===== CLIENT_SEARCHES ("Minhas Buscas")
CREATE TABLE IF NOT EXISTS public.client_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_searches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_searches' AND policyname='client_searches_owner_rw') THEN
    CREATE POLICY client_searches_owner_rw
    ON public.client_searches FOR ALL
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_client_searches_updated') THEN
    CREATE TRIGGER tg_client_searches_updated BEFORE UPDATE ON public.client_searches
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_searches_user ON public.client_searches(user_id);

-- ===== INDICAÇÕES
-- tabelas já existem; garantimos RLS
ALTER TABLE public.indications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indication_discounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='indications' AND policyname='indications_user_access_hotfix') THEN
    CREATE POLICY indications_user_access_hotfix
    ON public.indications FOR ALL
    USING (
      referrer_id = auth.uid() OR
      (referred_id IS NOT NULL AND referred_id = auth.uid())
    )
    WITH CHECK (referrer_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='indication_discounts' AND policyname='indication_discounts_visible_hotfix') THEN
    CREATE POLICY indication_discounts_visible_hotfix
    ON public.indication_discounts FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.indications i
      WHERE i.id = indication_discounts.indication_id
        AND i.referrer_id = auth.uid()
    ));
  END IF;
END $$;

-- índices úteis
CREATE INDEX IF NOT EXISTS idx_indications_referrer ON public.indications(referrer_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_owner ON public.imoveis(owner_id);