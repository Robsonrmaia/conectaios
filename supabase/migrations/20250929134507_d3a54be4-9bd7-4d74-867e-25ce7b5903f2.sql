-- 1) Garantir colunas e índices mínimos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.brokers  ADD COLUMN IF NOT EXISTS name text;

-- Um broker por usuário:
CREATE UNIQUE INDEX IF NOT EXISTS ux_brokers_user_id ON public.brokers(user_id);

-- 2) View de leitura unificada do corretor atual
CREATE OR REPLACE VIEW public.vw_current_broker AS
SELECT
  b.id               AS broker_id,
  b.user_id,
  COALESCE(b.name, p.name, p.full_name) AS display_name,
  b.username         AS username,
  COALESCE(b.avatar_url, p.avatar_url)  AS avatar_url,
  b.phone, b.bio, b.creci, b.whatsapp
FROM public.brokers b
JOIN public.profiles p ON p.id = b.user_id;

-- 3) RPC para salvar perfil (sincroniza profiles e brokers)
CREATE OR REPLACE FUNCTION public.fn_profile_save(
  p_user_id uuid,
  p_name text,
  p_phone text DEFAULT NULL,
  p_bio   text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET name = COALESCE(p_name, name),
         avatar_url = COALESCE(p_avatar_url, avatar_url),
         updated_at = now()
   WHERE id = p_user_id;

  UPDATE public.brokers
     SET name = COALESCE(p_name, name),
         phone = COALESCE(p_phone, phone),
         bio   = COALESCE(p_bio, bio),
         avatar_url = COALESCE(p_avatar_url, avatar_url),
         updated_at = now()
   WHERE user_id = p_user_id;

  -- Se não existir broker para o usuário (ambiente limpo), cria
  INSERT INTO public.brokers (id, user_id, name, phone, bio, avatar_url, created_at, updated_at)
  SELECT gen_random_uuid(), p_user_id, p_name, p_phone, p_bio, p_avatar_url, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM public.brokers WHERE user_id = p_user_id);
END;
$$;

-- 4) RLS (leitura da view usa as policies das tabelas):
-- garantir que o próprio usuário pode SELECT/UPDATE em profiles/brokers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_owner_rw') THEN
    CREATE POLICY profiles_owner_rw ON public.profiles FOR ALL
      USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='brokers' AND policyname='brokers_owner_rw') THEN
    CREATE POLICY brokers_owner_rw ON public.brokers FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;