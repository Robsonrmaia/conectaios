-- ConectaIOS - Complete Database Schema
-- Create enums first
CREATE TYPE public.app_role AS ENUM ('broker', 'regional_admin', 'global_admin');
CREATE TYPE public.property_visibility AS ENUM ('hidden', 'match_only', 'public_site');
CREATE TYPE public.client_status AS ENUM ('lead', 'prospect', 'client', 'inactive');
CREATE TYPE public.deal_status AS ENUM ('negotiating', 'proposal_sent', 'counter_proposal', 'accepted', 'closed', 'cancelled');
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'overdue', 'cancelled');

-- Regions table (cities like Ilhéus)
CREATE TABLE public.regions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Plans table
CREATE TABLE public.plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    max_properties INTEGER NOT NULL DEFAULT 50,
    max_clients INTEGER NOT NULL DEFAULT 100,
    max_messages_per_day INTEGER NOT NULL DEFAULT 500,
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Brokers table (main user accounts)
CREATE TABLE public.brokers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES public.regions(id),
    plan_id UUID REFERENCES public.plans(id),
    role public.app_role NOT NULL DEFAULT 'broker',
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    creci TEXT,
    bio TEXT,
    avatar_url TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    branding JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscriptions table (Asaas integration)
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    asaas_subscription_id TEXT UNIQUE,
    status public.subscription_status NOT NULL DEFAULT 'inactive',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Properties table
CREATE TABLE public.properties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    visibility public.property_visibility NOT NULL DEFAULT 'hidden',
    type TEXT NOT NULL, -- casa, apartamento, terreno, etc
    purpose TEXT NOT NULL, -- venda, aluguel, temporada
    price DECIMAL(12,2),
    area DECIMAL(10,2),
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    parking_spaces INTEGER DEFAULT 0,
    address JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Property media table
CREATE TABLE public.property_media (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL, -- image, video, document
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clients table (CRM)
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    status public.client_status NOT NULL DEFAULT 'lead',
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    preferences JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tasks table (CRM)
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notes table (CRM)
CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat threads table
CREATE TABLE public.threads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES public.regions(id),
    title TEXT,
    type TEXT DEFAULT 'private', -- private, group, deal
    deal_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Thread participants
CREATE TABLE public.thread_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(thread_id, broker_id)
);

-- Messages table (realtime chat)
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.brokers(id),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, image, document, property_share
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deals table (negotiations)
CREATE TABLE public.deals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    thread_id UUID REFERENCES public.threads(id),
    status public.deal_status NOT NULL DEFAULT 'negotiating',
    offer_amount DECIMAL(12,2),
    split_config JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {broker_id, percentage}
    contract_terms JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES public.brokers(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contracts table
CREATE TABLE public.contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    pdf_url TEXT,
    template_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    signed_at TIMESTAMP WITH TIME ZONE
);

-- Banners table (promotional content)
CREATE TABLE public.banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES public.regions(id),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sponsorships table (partnerships)
CREATE TABLE public.sponsorships (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES public.regions(id),
    name TEXT NOT NULL,
    logo_url TEXT,
    website TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Videos table (video library)
CREATE TABLE public.videos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referrals table (indique e ganhe)
CREATE TABLE public.referrals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.brokers(id),
    referred_email TEXT NOT NULL,
    referred_id UUID REFERENCES public.brokers(id),
    status TEXT DEFAULT 'pending', -- pending, completed, rewarded
    reward_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    broker_id UUID REFERENCES public.brokers(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create function to get user claims
CREATE OR REPLACE FUNCTION public.get_user_broker_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.brokers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_region_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT region_id FROM public.brokers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.brokers WHERE user_id = auth.uid() LIMIT 1;
$$;

-- RLS Policies

-- Regions: readable by all authenticated users, manageable by global_admins
CREATE POLICY "Regions are readable by authenticated users" 
ON public.regions FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Global admins can manage regions" 
ON public.regions FOR ALL TO authenticated 
USING (public.get_user_role() = 'global_admin');

-- Plans: readable by all, manageable by global_admins
CREATE POLICY "Plans are readable by authenticated users" 
ON public.plans FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Global admins can manage plans" 
ON public.plans FOR ALL TO authenticated 
USING (public.get_user_role() = 'global_admin');

-- Brokers: users can see their own profile, regional/global admins can see region brokers
CREATE POLICY "Users can view their own broker profile" 
ON public.brokers FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Regional admins can view region brokers" 
ON public.brokers FOR SELECT TO authenticated 
USING (
  public.get_user_role() IN ('regional_admin', 'global_admin') 
  AND region_id = public.get_user_region_id()
);

CREATE POLICY "Users can update their own broker profile" 
ON public.brokers FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage brokers" 
ON public.brokers FOR ALL TO authenticated 
USING (public.get_user_role() IN ('regional_admin', 'global_admin'));

-- Properties: brokers can manage their own, others can see public ones
CREATE POLICY "Brokers can manage their own properties" 
ON public.properties FOR ALL TO authenticated 
USING (broker_id = public.get_user_broker_id());

CREATE POLICY "Public properties are readable by region brokers" 
ON public.properties FOR SELECT TO authenticated 
USING (
  visibility = 'public_site' 
  AND broker_id IN (
    SELECT id FROM public.brokers WHERE region_id = public.get_user_region_id()
  )
);

-- Property media: follows property access rules
CREATE POLICY "Property media follows property access" 
ON public.property_media FOR ALL TO authenticated 
USING (
  property_id IN (
    SELECT id FROM public.properties 
    WHERE broker_id = public.get_user_broker_id()
  )
);

-- Clients: brokers can only see their own clients
CREATE POLICY "Brokers can manage their own clients" 
ON public.clients FOR ALL TO authenticated 
USING (broker_id = public.get_user_broker_id());

-- Tasks: brokers can only manage their own tasks
CREATE POLICY "Brokers can manage their own tasks" 
ON public.tasks FOR ALL TO authenticated 
USING (broker_id = public.get_user_broker_id());

-- Notes: brokers can only manage their own notes
CREATE POLICY "Brokers can manage their own notes" 
ON public.notes FOR ALL TO authenticated 
USING (broker_id = public.get_user_broker_id());

-- Threads: users can see threads they participate in
CREATE POLICY "Users can view threads they participate in" 
ON public.threads FOR SELECT TO authenticated 
USING (
  id IN (
    SELECT thread_id FROM public.thread_participants 
    WHERE broker_id = public.get_user_broker_id()
  )
);

CREATE POLICY "Users can create threads" 
ON public.threads FOR INSERT TO authenticated 
WITH CHECK (created_by = public.get_user_broker_id());

-- Thread participants: users can manage their participation
CREATE POLICY "Users can manage thread participation" 
ON public.thread_participants FOR ALL TO authenticated 
USING (broker_id = public.get_user_broker_id());

-- Messages: users can read/send in their threads
CREATE POLICY "Users can view messages in their threads" 
ON public.messages FOR SELECT TO authenticated 
USING (
  thread_id IN (
    SELECT thread_id FROM public.thread_participants 
    WHERE broker_id = public.get_user_broker_id()
  )
);

CREATE POLICY "Users can send messages in their threads" 
ON public.messages FOR INSERT TO authenticated 
WITH CHECK (
  sender_id = public.get_user_broker_id()
  AND thread_id IN (
    SELECT thread_id FROM public.thread_participants 
    WHERE broker_id = public.get_user_broker_id()
  )
);

-- Deals: brokers can see deals involving their properties/clients
CREATE POLICY "Brokers can view relevant deals" 
ON public.deals FOR SELECT TO authenticated 
USING (
  property_id IN (SELECT id FROM public.properties WHERE broker_id = public.get_user_broker_id())
  OR client_id IN (SELECT id FROM public.clients WHERE broker_id = public.get_user_broker_id())
  OR created_by = public.get_user_broker_id()
);

CREATE POLICY "Brokers can create deals" 
ON public.deals FOR INSERT TO authenticated 
WITH CHECK (created_by = public.get_user_broker_id());

CREATE POLICY "Deal participants can update deals" 
ON public.deals FOR UPDATE TO authenticated 
USING (
  property_id IN (SELECT id FROM public.properties WHERE broker_id = public.get_user_broker_id())
  OR created_by = public.get_user_broker_id()
);

-- Contracts: follow deal access rules
CREATE POLICY "Users can view contracts for their deals" 
ON public.contracts FOR SELECT TO authenticated 
USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE 
    property_id IN (SELECT id FROM public.properties WHERE broker_id = public.get_user_broker_id())
    OR created_by = public.get_user_broker_id()
  )
);

-- Banners: regional content
CREATE POLICY "Users can view region banners" 
ON public.banners FOR SELECT TO authenticated 
USING (region_id = public.get_user_region_id());

CREATE POLICY "Admins can manage banners" 
ON public.banners FOR ALL TO authenticated 
USING (public.get_user_role() IN ('regional_admin', 'global_admin'));

-- Sponsorships: regional content
CREATE POLICY "Users can view region sponsorships" 
ON public.sponsorships FOR SELECT TO authenticated 
USING (region_id = public.get_user_region_id());

CREATE POLICY "Admins can manage sponsorships" 
ON public.sponsorships FOR ALL TO authenticated 
USING (public.get_user_role() IN ('regional_admin', 'global_admin'));

-- Videos: public videos for all, private for admins
CREATE POLICY "Users can view public videos" 
ON public.videos FOR SELECT TO authenticated 
USING (is_public = true);

CREATE POLICY "Admins can view all videos" 
ON public.videos FOR SELECT TO authenticated 
USING (public.get_user_role() IN ('regional_admin', 'global_admin'));

CREATE POLICY "Admins can manage videos" 
ON public.videos FOR ALL TO authenticated 
USING (public.get_user_role() IN ('regional_admin', 'global_admin'));

-- Referrals: users can manage their referrals
CREATE POLICY "Users can manage their referrals" 
ON public.referrals FOR ALL TO authenticated 
USING (referrer_id = public.get_user_broker_id() OR referred_id = public.get_user_broker_id());

-- Audit logs: read-only for users, full access for admins
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs FOR SELECT TO authenticated 
USING (broker_id = public.get_user_broker_id());

CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs FOR SELECT TO authenticated 
USING (public.get_user_role() IN ('regional_admin', 'global_admin'));

-- Subscriptions: users can view their own
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions FOR SELECT TO authenticated 
USING (broker_id = public.get_user_broker_id());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.regions (name, slug) VALUES ('Ilhéus', 'ilheus');

INSERT INTO public.plans (name, price_monthly, max_properties, max_clients, max_messages_per_day, features) VALUES 
('Básico', 97.00, 20, 50, 200, '["crm_basico", "chat", "mini_site"]'),
('Profissional', 197.00, 50, 150, 500, '["crm_avancado", "chat", "mini_site", "simuladores", "relatorios"]'),
('Premium', 397.00, 100, 300, 1000, '["crm_completo", "chat", "mini_site", "simuladores", "relatorios", "ia_assistant", "match_inteligente"]');