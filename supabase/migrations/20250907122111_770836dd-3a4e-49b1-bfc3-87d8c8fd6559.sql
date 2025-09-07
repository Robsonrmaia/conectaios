-- Create table for minisite configurations
CREATE TABLE public.minisite_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'modern',
  primary_color TEXT NOT NULL DEFAULT '#0EA5E9',
  secondary_color TEXT NOT NULL DEFAULT '#64748B',
  title TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  custom_message TEXT,
  show_properties BOOLEAN DEFAULT true,
  show_contact_form BOOLEAN DEFAULT true,
  show_about BOOLEAN DEFAULT true,
  config_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  generated_url TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.minisite_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Brokers can manage their own minisite configs" 
ON public.minisite_configs 
FOR ALL 
USING (broker_id IN (
  SELECT id FROM conectaios_brokers WHERE user_id = auth.uid()
));

CREATE POLICY "Public can view active minisite configs by URL" 
ON public.minisite_configs 
FOR SELECT 
USING (is_active = true AND generated_url IS NOT NULL);

-- Add foreign key constraint
ALTER TABLE public.minisite_configs 
ADD CONSTRAINT fk_minisite_configs_broker 
FOREIGN KEY (broker_id) REFERENCES public.conectaios_brokers(id) ON DELETE CASCADE;

-- Create updated_at trigger
CREATE TRIGGER update_minisite_configs_updated_at
BEFORE UPDATE ON public.minisite_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_minisite_configs_broker_id ON public.minisite_configs(broker_id);
CREATE INDEX idx_minisite_configs_url ON public.minisite_configs(generated_url);
CREATE INDEX idx_minisite_configs_active ON public.minisite_configs(is_active);