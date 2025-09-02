-- Create broker_registrations table for signup form
CREATE TABLE public.broker_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  creci TEXT,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.broker_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for registration form)
CREATE POLICY "Allow public registration" 
ON public.broker_registrations 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow authenticated users to view registrations
CREATE POLICY "Authenticated users can view registrations" 
ON public.broker_registrations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);