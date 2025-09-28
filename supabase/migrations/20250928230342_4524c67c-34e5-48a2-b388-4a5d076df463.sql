-- PERFIL (profiles) — o dono (id = auth.uid) pode ler/editar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_owner_rw') THEN
    CREATE POLICY profiles_owner_rw
    ON public.profiles FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- BROKERS — o dono (user_id = auth.uid) pode ler/editar
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brokers' AND policyname='brokers_owner_rw') THEN
    CREATE POLICY brokers_owner_rw
    ON public.brokers FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- INDICAÇÕES — referrer ou referred pode ler; referrer pode escrever
ALTER TABLE public.indications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='indications' AND policyname='indications_user_read') THEN
    CREATE POLICY indications_user_read ON public.indications
    FOR SELECT USING (
      referrer_id = auth.uid() OR
      COALESCE(referred_id, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='indications' AND policyname='indications_referrer_manage') THEN
    CREATE POLICY indications_referrer_manage ON public.indications
    FOR ALL USING (referrer_id = auth.uid())
    WITH CHECK (referrer_id = auth.uid());
  END IF;
END $$;

-- CLIENT_SEARCHES — dono (user_id) pode ler/editar
ALTER TABLE public.client_searches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_searches' AND policyname='client_searches_owner_rw') THEN
    CREATE POLICY client_searches_owner_rw ON public.client_searches
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Triggers de updated_at (idempotentes)
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_brokers_updated') THEN
    CREATE TRIGGER tg_brokers_updated BEFORE UPDATE ON public.brokers FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_profiles_updated') THEN
    CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;

-- Adicionar coluna specialties se não existir
ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS specialties text;