-- Create property_submissions table
CREATE TABLE public.property_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_token TEXT NOT NULL UNIQUE,
  broker_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  property_data JSONB NOT NULL DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  exclusivity_type TEXT NOT NULL CHECK (exclusivity_type IN ('exclusive', 'non_exclusive')),
  consent_ip_address TEXT,
  consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'imported', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can create submissions with valid token" 
ON public.property_submissions 
FOR INSERT 
WITH CHECK (submission_token IS NOT NULL);

CREATE POLICY "Public can view their own submission by token" 
ON public.property_submissions 
FOR SELECT 
USING (auth.uid() IS NULL);

CREATE POLICY "Brokers can view their submissions" 
ON public.property_submissions 
FOR SELECT 
USING (broker_id IN (
  SELECT id FROM conectaios_brokers 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Brokers can update their submissions" 
ON public.property_submissions 
FOR UPDATE 
USING (broker_id IN (
  SELECT id FROM conectaios_brokers 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Brokers can delete their submissions" 
ON public.property_submissions 
FOR DELETE 
USING (broker_id IN (
  SELECT id FROM conectaios_brokers 
  WHERE user_id = auth.uid()
));

-- Function to generate submission token
CREATE OR REPLACE FUNCTION public.generate_submission_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    token := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
    SELECT EXISTS(
      SELECT 1 FROM public.property_submissions WHERE submission_token = token
    ) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_property_submissions_updated_at
BEFORE UPDATE ON public.property_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();