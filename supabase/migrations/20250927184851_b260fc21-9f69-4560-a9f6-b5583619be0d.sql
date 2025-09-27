-- ConectaIOS SaaS - Auth Setup + Primeiro Admin Automático

-- (A) profiles: coluna role (se não existir)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- (B) Atualizar logo para a nova URL
INSERT INTO public.system_settings (key, value) VALUES
('site_logo_url', jsonb_build_object('url','https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/logonova.png'))
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- (C) Trigger: criar profile após signup (se faltar)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname='on_auth_user_created' AND tgrelid='auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- (D) "Primeiro admin": quem fizer o primeiro cadastro vira admin automaticamente
CREATE OR REPLACE FUNCTION public.fn_promote_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles WHERE role='admin') = 0 THEN
    UPDATE public.profiles SET role='admin' WHERE id=NEW.id;
  END IF;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname='on_profile_created_promote_first_admin' AND tgrelid='public.profiles'::regclass
  ) THEN
    CREATE TRIGGER on_profile_created_promote_first_admin
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_promote_first_admin();
  END IF;
END $$;