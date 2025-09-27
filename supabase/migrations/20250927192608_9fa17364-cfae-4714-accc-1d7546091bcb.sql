-- ===== PERFIL/BROKER/MINISITE: colunas & helpers =============================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS bio text;

-- Cria profiles no signup (se faltar)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
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

-- Garante um broker por usuário, retornando id
CREATE OR REPLACE FUNCTION public.ensure_broker_for_user(p_user uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE bid uuid;
BEGIN
  INSERT INTO public.brokers (user_id, created_at)
  VALUES (p_user, now())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO bid;
  RETURN bid;
END $$;

-- Garante config de minisite padrão para o usuário
CREATE OR REPLACE FUNCTION public.ensure_minisite_for_user(p_user uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE mid uuid;
BEGIN
  INSERT INTO public.minisite_configs (user_id, title, primary_color, secondary_color, template_id,
                                       show_properties, show_contact, show_about, created_at, updated_at)
  VALUES (p_user, 'Meu Minisite', '#3B82F6', '#EF4444', 'default', true, true, true, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO mid;
  RETURN mid;
END $$;

-- ===== SUPORTE: tabela + RLS =================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',      -- open | in_progress | closed
  priority text NOT NULL DEFAULT 'normal',  -- low | normal | high
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_user    ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_status  ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_prio    ON public.support_tickets(priority);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Owner pode ler/inserir/atualizar os seus
DROP POLICY IF EXISTS support_owner_select  ON public.support_tickets;
DROP POLICY IF EXISTS support_owner_insert  ON public.support_tickets;
DROP POLICY IF EXISTS support_owner_update  ON public.support_tickets;
DROP POLICY IF EXISTS support_admin_all     ON public.support_tickets;

CREATE POLICY support_owner_select ON public.support_tickets
FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY support_owner_insert ON public.support_tickets
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY support_owner_update ON public.support_tickets
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin gerencia tudo
CREATE POLICY support_admin_all ON public.support_tickets
FOR ALL USING (EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS tg_support_updated ON public.support_tickets;
CREATE TRIGGER tg_support_updated
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ===== TESTEMUNHOS: tabela + RLS ============================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,             -- dono do minisite/corretor
  author_name text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL,
  source text,                       -- ex.: 'site', 'google', 'facebook'
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_user ON public.testimonials(user_id);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS testi_owner_select ON public.testimonials;
DROP POLICY IF EXISTS testi_owner_cud    ON public.testimonials;
DROP POLICY IF EXISTS testi_admin_all    ON public.testimonials;

CREATE POLICY testi_owner_select ON public.testimonials
FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY testi_owner_cud ON public.testimonials
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY testi_admin_all ON public.testimonials
FOR ALL USING (EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP TRIGGER IF EXISTS tg_testi_updated ON public.testimonials;
CREATE TRIGGER tg_testi_updated
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ===== PARCEIROS: tabela + RLS ==============================================
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,           -- dono do minisite/corretor
  name text NOT NULL,
  logo_url text,
  website text,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_partners_user ON public.partners(user_id);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partners_owner_select ON public.partners;
DROP POLICY IF EXISTS partners_owner_cud    ON public.partners;
DROP POLICY IF EXISTS partners_admin_all    ON public.partners;

CREATE POLICY partners_owner_select ON public.partners
FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY partners_owner_cud ON public.partners
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY partners_admin_all ON public.partners
FOR ALL USING (EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP TRIGGER IF EXISTS tg_partners_updated ON public.partners;
CREATE TRIGGER tg_partners_updated
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();