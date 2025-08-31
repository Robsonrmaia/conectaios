-- Create RLS policies for all tables

-- Deals policies
CREATE POLICY "Brokers can manage their deals" ON public.deals 
FOR ALL USING (
  buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Deal history policies  
CREATE POLICY "Brokers can view deal history they participate in" ON public.deal_history 
FOR SELECT USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE 
    buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Brokers can insert deal history" ON public.deal_history 
FOR INSERT WITH CHECK (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Threads policies
CREATE POLICY "Brokers can access threads they participate in" ON public.threads 
FOR ALL USING (
  (SELECT id FROM public.brokers WHERE user_id = auth.uid()) = ANY(participants)
);

-- Contracts policies
CREATE POLICY "Brokers can manage contracts for their deals" ON public.contracts 
FOR ALL USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE 
    buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  )
);

-- Client preferences policies
CREATE POLICY "Brokers can manage client preferences" ON public.client_preferences 
FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

-- Plan tools policies (public read)
CREATE POLICY "Public can view plan tools" ON public.plan_tools 
FOR SELECT USING (true);

-- Referrals policies
CREATE POLICY "Brokers can manage their referrals" ON public.referrals 
FOR ALL USING (
  referrer_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  referred_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Content policies (public read for active content)
CREATE POLICY "Public can view active banners" ON public.banners 
FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view videos" ON public.videos 
FOR SELECT USING (true);

CREATE POLICY "Public can view active partnerships" ON public.partnerships 
FOR SELECT USING (is_active = true);

-- Update messages table to add thread support and broker reference
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.brokers(id),
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Update messages policies
DROP POLICY IF EXISTS "Users can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

CREATE POLICY "Brokers can view messages in their threads" ON public.messages
FOR SELECT USING (
  thread_id IN (
    SELECT id FROM public.threads WHERE 
    (SELECT id FROM public.brokers WHERE user_id = auth.uid()) = ANY(participants)
  )
);

CREATE POLICY "Brokers can insert messages in their threads" ON public.messages
FOR INSERT WITH CHECK (
  thread_id IN (
    SELECT id FROM public.threads WHERE 
    (SELECT id FROM public.brokers WHERE user_id = auth.uid()) = ANY(participants)
  ) AND
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

CREATE POLICY "Brokers can update their own messages" ON public.messages
FOR UPDATE USING (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON public.brokers(user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_username ON public.brokers(username);  
CREATE INDEX IF NOT EXISTS idx_brokers_region ON public.brokers(region_id);
CREATE INDEX IF NOT EXISTS idx_deals_property ON public.deals(property_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_broker ON public.deals(buyer_broker_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_threads_participants ON public.threads USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_broker ON public.messages(broker_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_deal ON public.deal_history(deal_id);

-- Insert sample plan tools
INSERT INTO public.plan_tools (plan_id, tool_name, is_enabled, daily_limit, monthly_limit) 
SELECT p.id, tool, true, daily_lmt, monthly_lmt
FROM public.plans p
CROSS JOIN (
  VALUES 
  ('match_engine', 10, 50),
  ('pdf_contracts', 5, 20),
  ('ai_assistant', 20, 100),
  ('advanced_crm', null, null),
  ('analytics', null, null),
  ('minisite', null, null)
) AS tools(tool, daily_lmt, monthly_lmt)
WHERE p.slug IN ('professional', 'premium')
ON CONFLICT (plan_id, tool_name) DO NOTHING;