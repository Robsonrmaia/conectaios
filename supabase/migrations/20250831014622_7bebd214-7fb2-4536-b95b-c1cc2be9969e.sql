-- Create RLS policies for all tables

-- Deals policies  
CREATE POLICY IF NOT EXISTS "Brokers can manage their deals" ON public.deals 
FOR ALL USING (
  buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Deal history policies
CREATE POLICY IF NOT EXISTS "Brokers can view deal history they participate in" ON public.deal_history 
FOR SELECT USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE 
    buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  )
);

CREATE POLICY IF NOT EXISTS "Brokers can insert deal history" ON public.deal_history 
FOR INSERT WITH CHECK (
  broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Threads policies
CREATE POLICY IF NOT EXISTS "Brokers can access threads they participate in" ON public.threads 
FOR ALL USING (
  (SELECT id FROM public.brokers WHERE user_id = auth.uid()) = ANY(participants)
);

-- Client preferences policies
CREATE POLICY IF NOT EXISTS "Brokers can manage client preferences" ON public.client_preferences 
FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

-- Content policies (admin managed)
CREATE POLICY IF NOT EXISTS "Public can view banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "Public can view videos" ON public.videos FOR SELECT USING (true);  
CREATE POLICY IF NOT EXISTS "Public can view partnerships" ON public.partnerships FOR SELECT USING (is_active = true);

-- Contracts policies
CREATE POLICY IF NOT EXISTS "Brokers can manage contracts for their deals" ON public.contracts 
FOR ALL USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE 
    buyer_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    seller_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
    listing_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  )
);

-- Referrals policies  
CREATE POLICY IF NOT EXISTS "Brokers can manage their referrals" ON public.referrals 
FOR ALL USING (
  referrer_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid()) OR
  referred_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
);

-- Plan tools policies
CREATE POLICY IF NOT EXISTS "Public can view plan tools" ON public.plan_tools FOR SELECT USING (true);

-- Update messages table for new thread system
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.brokers(id),
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON public.brokers(user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_username ON public.brokers(username);
CREATE INDEX IF NOT EXISTS idx_brokers_region ON public.brokers(region_id);
CREATE INDEX IF NOT EXISTS idx_properties_region ON public.properties(region_id);
CREATE INDEX IF NOT EXISTS idx_properties_visibility ON public.properties(visibility);
CREATE INDEX IF NOT EXISTS idx_deals_property ON public.deals(property_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_broker ON public.deals(buyer_broker_id);
CREATE INDEX IF NOT EXISTS idx_threads_participants ON public.threads USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id);