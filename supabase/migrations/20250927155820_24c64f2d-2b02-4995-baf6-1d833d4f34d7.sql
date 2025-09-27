-- Correção Completa do Schema ConectaIOS
-- Criar todas as tabelas necessárias de uma vez

-- 1. Conectaios Brokers (substituir a tabela brokers simples)
CREATE TABLE IF NOT EXISTS public.conectaios_brokers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text,
  email text,
  creci text,
  phone text,
  avatar_url text,
  cover_url text,
  username text UNIQUE,
  bio text,
  whatsapp text,
  cpf_cnpj text,
  referral_code text,
  status text DEFAULT 'active',
  subscription_status text DEFAULT 'trial',
  minisite_slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Property Submissions
CREATE TABLE IF NOT EXISTS public.property_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id uuid,
  name text,
  email text,
  phone text,
  message text,
  property_data jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Chat System Tables
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  is_group boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  UNIQUE(thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text,
  attachments jsonb DEFAULT '[]'::jsonb,
  reply_to_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL,
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'delivered',
  created_at timestamptz DEFAULT now(),
  UNIQUE(thread_id, message_id, user_id, status)
);

-- 4. Indications System
CREATE TABLE IF NOT EXISTS public.indications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referred_email text,
  referred_phone text,
  status text DEFAULT 'pending',
  reward_amount numeric DEFAULT 0,
  reward_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.indication_discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indication_id uuid NOT NULL,
  discount_percentage numeric DEFAULT 10,
  valid_until timestamptz,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text,
  body text,
  meta jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. Add missing columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.crm_clients ADD COLUMN IF NOT EXISTS indication_id uuid;

-- 7. Enable RLS on all tables
ALTER TABLE public.conectaios_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indication_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies
-- Conectaios Brokers
CREATE POLICY "conectaios_brokers_owner_access" ON public.conectaios_brokers
  FOR ALL USING (user_id = auth.uid());

-- Property Submissions
CREATE POLICY "property_submissions_broker_access" ON public.property_submissions
  FOR ALL USING (broker_id IN (
    SELECT id FROM public.conectaios_brokers WHERE user_id = auth.uid()
  ));

CREATE POLICY "property_submissions_public_insert" ON public.property_submissions
  FOR INSERT WITH CHECK (true);

-- Chat System
CREATE POLICY "chat_threads_participants" ON public.chat_threads
  FOR ALL USING (
    id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "chat_participants_member_access" ON public.chat_participants
  FOR ALL USING (user_id = auth.uid() OR thread_id IN (
    SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "chat_messages_thread_participants" ON public.chat_messages
  FOR ALL USING (
    thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "chat_receipts_participant_access" ON public.chat_receipts
  FOR ALL USING (
    user_id = auth.uid() OR 
    thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

-- Indications
CREATE POLICY "indications_user_access" ON public.indications
  FOR ALL USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "indication_discounts_owner_access" ON public.indication_discounts
  FOR ALL USING (
    indication_id IN (SELECT id FROM public.indications WHERE referrer_id = auth.uid())
  );

-- Notifications  
CREATE POLICY "notifications_owner_access" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- 9. Create useful functions
CREATE OR REPLACE FUNCTION public.find_existing_one_to_one_thread(user_a uuid, user_b uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.id
  FROM public.chat_threads t
  WHERE t.is_group = false
    AND EXISTS (
      SELECT 1 FROM public.chat_participants p1 
      WHERE p1.thread_id = t.id AND p1.user_id = user_a AND p1.left_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.chat_participants p2 
      WHERE p2.thread_id = t.id AND p2.user_id = user_b AND p2.left_at IS NULL
    )
    AND (
      SELECT count(*) FROM public.chat_participants p3 
      WHERE p3.thread_id = t.id AND p3.left_at IS NULL
    ) = 2
  LIMIT 1;
$$;

-- 10. Create update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conectaios_brokers_updated_at
  BEFORE UPDATE ON public.conectaios_brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_submissions_updated_at
  BEFORE UPDATE ON public.property_submissions  
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_indications_updated_at
  BEFORE UPDATE ON public.indications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();