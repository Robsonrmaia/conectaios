-- Create missing tables and improve RLS policies

-- Create media table for property images/videos
CREATE TABLE IF NOT EXISTS public.media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size INTEGER,
  file_name TEXT,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on media table
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Create policies for media table
CREATE POLICY "Users can manage their own media" 
ON public.media 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view media from public properties"
ON public.media
FOR SELECT
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE is_public = true AND visibility = 'public_site'
  )
);

-- Create pipelines table for CRM
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pipelines table
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

-- Create policies for pipelines table
CREATE POLICY "Users can manage their own pipelines" 
ON public.pipelines 
FOR ALL 
USING (auth.uid() = user_id);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notes table
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies for notes table
CREATE POLICY "Users can manage their own notes" 
ON public.notes 
FOR ALL 
USING (auth.uid() = user_id);

-- Create subscriptions table for billing
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  asaas_subscription_id TEXT,
  asaas_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'suspended', 'overdue')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions table
CREATE POLICY "Brokers can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE user_id = auth.uid()
  )
);

-- Create audit_logs table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  broker_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs table (only admins can access)
CREATE POLICY "Only admins can access audit logs" 
ON public.audit_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add missing columns to properties table for better functionality
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'novo_lead',
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id),
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Improve brokers table RLS policies
DROP POLICY IF EXISTS "Public can view active brokers" ON public.brokers;
CREATE POLICY "Public can view limited broker info for mini sites" 
ON public.brokers 
FOR SELECT 
USING (
  status = 'active' AND 
  (auth.uid() IS NULL OR auth.uid() != user_id)
);

-- Add trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_media_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_property_id ON public.media(property_id);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON public.pipelines(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON public.notes(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_broker_id ON public.subscriptions(broker_id);
CREATE INDEX IF NOT EXISTS idx_properties_visibility ON public.properties(visibility);
CREATE INDEX IF NOT EXISTS idx_properties_user_id_visibility ON public.properties(user_id, visibility);
CREATE INDEX IF NOT EXISTS idx_clients_user_id_stage ON public.clients(user_id, stage);