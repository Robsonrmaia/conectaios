-- SIMPLE COMPATIBILITY TABLES AND VIEWS FOR BUILD FIX
-- Creating missing tables and simple views

-- 1. Support tickets table (if not exists)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  broker_id uuid,
  assignee_id uuid,
  subject text NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  category text DEFAULT 'geral',
  title text, -- compatibility field
  description text, -- compatibility field
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Support ticket messages table (if not exists)
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.support_tickets(id),
  user_id uuid,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Contacts table (if not exists)
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  message text,
  source text,
  created_at timestamptz DEFAULT now()
);

-- 4. Property submissions table improvements
ALTER TABLE public.property_submissions 
ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS exclusivity_type text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS submission_token text,
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS owner_email text,
ADD COLUMN IF NOT EXISTS owner_phone text,
ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();

-- 5. Enable RLS on new tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for support tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());
  
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());
  
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.support_tickets;
CREATE POLICY "Users can update their own tickets" ON public.support_tickets
  FOR UPDATE USING (user_id = auth.uid());

-- 7. Create RLS policies for ticket messages
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.support_ticket_messages;
CREATE POLICY "Users can view messages for their tickets" ON public.support_ticket_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
  );
  
DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.support_ticket_messages;
CREATE POLICY "Users can create messages for their tickets" ON public.support_ticket_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
  );

-- 8. Create RLS policies for contacts  
DROP POLICY IF EXISTS "Brokers can view their contacts" ON public.contacts;
CREATE POLICY "Brokers can view their contacts" ON public.contacts
  FOR SELECT USING (
    broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  );
  
DROP POLICY IF EXISTS "Anyone can create contacts" ON public.contacts;
CREATE POLICY "Anyone can create contacts" ON public.contacts
  FOR INSERT WITH CHECK (true);