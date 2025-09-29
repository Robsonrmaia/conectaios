-- BROKERS: colunas usadas pelo Perfil
ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS specialties text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Criar índice único para username se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brokers_username_unique') THEN
    ALTER TABLE public.brokers ADD CONSTRAINT brokers_username_unique UNIQUE (username);
  END IF;
END $$;

-- RLS brokers: o dono (user_id=auth.uid()) pode tudo
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='brokers' AND policyname='brokers_owner_full_access'
  ) THEN
    CREATE POLICY brokers_owner_full_access
    ON public.brokers FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- PROFILES: garantir que o próprio usuário pode atualizar seu profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Adicionar colunas necessárias em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_owner_full_access'
  ) THEN
    CREATE POLICY profiles_owner_full_access
    ON public.profiles FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  END IF;
END $$;