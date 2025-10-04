-- ============================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA (v6 - DEFENSIVA)
-- ============================================

-- 1. MIGRAR DADOS DE profiles.role PARA user_roles
-- ============================================

INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
WHERE role IS NOT NULL
  AND role::text IN ('admin', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. ATUALIZAR POLÍTICAS EM TABELAS EXISTENTES
-- ============================================

-- audit_log
DROP POLICY IF EXISTS "ops_admin_read_audit" ON public.audit_log;
DROP POLICY IF EXISTS "saas_ops_admin_read_audit" ON public.audit_log;

CREATE POLICY "ops_admin_read_audit" 
ON public.audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "saas_ops_admin_read_audit" 
ON public.audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- support_tickets
DROP POLICY IF EXISTS "support_owner_select" ON public.support_tickets;
DROP POLICY IF EXISTS "support_admin_all" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_admin_all" ON public.support_tickets;

CREATE POLICY "support_owner_select" 
ON public.support_tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "support_admin_all" 
ON public.support_tickets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- testimonials
DROP POLICY IF EXISTS "testi_owner_select" ON public.testimonials;
DROP POLICY IF EXISTS "testi_admin_all" ON public.testimonials;

CREATE POLICY "testi_owner_select" 
ON public.testimonials FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "testi_admin_all" 
ON public.testimonials FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- partners
DROP POLICY IF EXISTS "partners_owner_select" ON public.partners;
DROP POLICY IF EXISTS "partners_admin_all" ON public.partners;

CREATE POLICY "partners_owner_select" 
ON public.partners FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "partners_admin_all" 
ON public.partners FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- social_banners
DROP POLICY IF EXISTS "Admin pode gerenciar banners" ON public.social_banners;

CREATE POLICY "Admin pode gerenciar banners" 
ON public.social_banners FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- market_stats
DROP POLICY IF EXISTS "Only admins can manage market stats" ON public.market_stats;

CREATE POLICY "Only admins can manage market stats" 
ON public.market_stats FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. REMOVER COLUNA role
-- ============================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role CASCADE;

-- 4. POLÍTICAS PARA TABELAS OPCIONAIS
-- ============================================

-- banners (se existir)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'banners') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners';
    EXECUTE 'CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true)';
    EXECUTE 'CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- webhook_logs (se existir)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'webhook_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "ops_admin_read_webhooks" ON public.webhook_logs';
    EXECUTE 'DROP POLICY IF EXISTS "saas_ops_admin_read_webhooks" ON public.webhook_logs';
    EXECUTE 'CREATE POLICY "ops_admin_read_webhooks" ON public.webhook_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "saas_ops_admin_read_webhooks" ON public.webhook_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- 5. RESTRINGIR DADOS SENSÍVEIS
-- ============================================

-- brokers
DROP POLICY IF EXISTS "brokers_public_minisite" ON public.brokers;
DROP POLICY IF EXISTS "Public can view active broker minisites" ON public.brokers;

CREATE POLICY "Public can view active broker minisites"
ON public.brokers FOR SELECT
USING (status = 'active' AND username IS NOT NULL AND username != '');

COMMENT ON POLICY "Public can view active broker minisites" ON public.brokers IS 
'ATENÇÃO: Ao consultar brokers públicos, selecionar APENAS: id, name, username, bio, avatar_url, cover_url, creci. NUNCA: email, phone, cpf_cnpj, whatsapp';

-- system_settings
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can check maintenance mode" ON public.system_settings;

CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can check maintenance mode"
ON public.system_settings FOR SELECT
USING (key = 'maintenance_mode');

-- minisite_configs
DROP POLICY IF EXISTS "Public can view minisite configs" ON public.minisite_configs;
DROP POLICY IF EXISTS "Users can manage own minisite" ON public.minisite_configs;
DROP POLICY IF EXISTS "Public can view active minisites" ON public.minisite_configs;

CREATE POLICY "Users can manage own minisite"
ON public.minisite_configs FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view active minisites"
ON public.minisite_configs FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.brokers b 
    WHERE b.user_id = minisite_configs.user_id 
    AND b.status = 'active'
  )
);

-- social_presence
DROP POLICY IF EXISTS "presence_read_all" ON public.social_presence;
DROP POLICY IF EXISTS "Authenticated users can view presence" ON public.social_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON public.social_presence;

CREATE POLICY "Authenticated users can view presence"
ON public.social_presence FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own presence"
ON public.social_presence FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. FUNÇÕES DE SEGURANÇA
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(check_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.fn_promote_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'social.conectaios@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  user_id_param uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN false;
  END IF;
  
  IF new_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid role: %. Valid roles: admin, user', new_role;
  END IF;
  
  DELETE FROM public.user_roles WHERE user_id = user_id_param;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id_param, new_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;