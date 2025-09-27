-- Criar tabelas mínimas necessárias
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  property_limit integer NOT NULL DEFAULT 10,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir planos básicos
INSERT INTO public.plans (name, slug, price, property_limit, features) VALUES
('Básico', 'basico', 0, 10, '["10 imóveis", "Suporte básico"]'),
('Premium', 'premium', 99.90, 50, '["50 imóveis", "Suporte prioritário", "Analytics"]'),
('Professional', 'professional', 199.90, 100, '["100 imóveis", "Suporte VIP", "Analytics avançado", "API"]')
ON CONFLICT (slug) DO NOTHING;

-- Criar tabela de presence para chat
CREATE TABLE IF NOT EXISTS public.chat_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'offline',
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  typing_in_thread uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela de support tickets 
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  broker_id uuid,
  assignee_id uuid,
  title text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'geral',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar view para audit_logs (alias para audit_log)
CREATE OR REPLACE VIEW public.audit_logs AS 
SELECT 
  id,
  action,
  entity as resource_type,
  entity_id as resource_id,
  meta->>'old_values' as old_values,
  meta->>'new_values' as new_values,
  actor as user_id,
  at as created_at
FROM public.audit_log;

-- Corrigir view properties com todos os aliases
DROP VIEW IF EXISTS public.properties;
CREATE OR REPLACE VIEW public.properties AS
SELECT 
  id,
  title,
  title as titulo,
  description,
  description as descricao,
  purpose,
  price,
  price as valor,
  city,
  city as cidade,
  neighborhood,
  neighborhood as bairro,
  is_public,
  visibility,
  owner_id,
  created_at,
  updated_at,
  (SELECT url FROM imovel_images WHERE imovel_id = imoveis.id AND is_cover = true LIMIT 1) as thumb_url,
  type,
  status,
  bedrooms,
  bathrooms,
  area_total,
  area_built
FROM public.imoveis;

-- Criar funções RPC necessárias
CREATE OR REPLACE FUNCTION public.get_security_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', COALESCE((SELECT COUNT(*) FROM auth.users), 0),
    'active_sessions', COALESCE((SELECT COUNT(*) FROM auth.sessions WHERE expires_at > now()), 0),
    'failed_logins', 0,
    'security_alerts', 0
  ) INTO result;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_referral_code(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code text;
BEGIN
  -- Gerar código único baseado no ID do usuário
  code := 'REF' || substr(replace(user_uuid::text, '-', ''), 1, 8);
  
  RETURN upper(code);
END;
$$;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true);

CREATE POLICY "chat_presence_user_access" ON public.chat_presence 
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "support_tickets_user_access" ON public.support_tickets 
FOR ALL USING (user_id = auth.uid() OR assignee_id = auth.uid());

CREATE POLICY "support_tickets_admin_all" ON public.support_tickets 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger para updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_presence_updated_at BEFORE UPDATE ON public.chat_presence 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();