-- ===== CONECTAIOS SAAS SCHEMA COMPLETO - PARTE 2 =====
-- Continuação: Tabelas restantes + Triggers + RLS completo

-- 8) Leads capturados
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  broker_id uuid REFERENCES public.brokers(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  message text,
  source text,
  status text CHECK (status IN ('new','contacted','qualified','lost','won')) DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_imovel ON public.leads(imovel_id);
CREATE INDEX IF NOT EXISTS idx_leads_broker ON public.leads(broker_id);

-- 9) Matches entre corretores
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responder_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text CHECK (status IN ('pending','accepted','declined')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matches_imovel ON public.matches(imovel_id);
CREATE INDEX IF NOT EXISTS idx_matches_requester ON public.matches(requester_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- 10) Mensageria por match
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id);

-- 11) Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text,
  plan text,
  status text CHECK (status IN ('trial','active','past_due','canceled')) DEFAULT 'trial',
  external_customer_id text,
  external_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 12) Auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  at timestamptz DEFAULT now(),
  actor uuid,
  action text,
  entity text,
  entity_id uuid,
  meta jsonb
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_log(actor);

-- 13) Logs de webhooks
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id bigserial PRIMARY KEY,
  at timestamptz DEFAULT now(),
  source text,
  status int,
  error text,
  payload jsonb
);

-- 14) Triggers - Função updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS tg_profiles_updated ON public.profiles;
CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();

DROP TRIGGER IF EXISTS tg_brokers_updated ON public.brokers;
CREATE TRIGGER tg_brokers_updated BEFORE UPDATE ON public.brokers
FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();

DROP TRIGGER IF EXISTS tg_imoveis_updated ON public.imoveis;
CREATE TRIGGER tg_imoveis_updated BEFORE UPDATE ON public.imoveis
FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();

DROP TRIGGER IF EXISTS tg_minisites_updated ON public.minisites;
CREATE TRIGGER tg_minisites_updated BEFORE UPDATE ON public.minisites
FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();

DROP TRIGGER IF EXISTS tg_matches_updated ON public.matches;
CREATE TRIGGER tg_matches_updated BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();

-- 15) Normalização + FTS para imoveis
CREATE OR REPLACE FUNCTION public.fn_imoveis_set_fts()
RETURNS trigger LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.norm_title := lower(regexp_replace(coalesce(NEW.title,''),'[^\w\s]+','','g'));
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.neighborhood,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.city,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'D');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_imoveis_fts ON public.imoveis;
CREATE TRIGGER tg_imoveis_fts
BEFORE INSERT OR UPDATE ON public.imoveis
FOR EACH ROW EXECUTE PROCEDURE public.fn_imoveis_set_fts();

-- 16) ATIVAR RLS EM TODAS AS TABELAS NOVAS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;