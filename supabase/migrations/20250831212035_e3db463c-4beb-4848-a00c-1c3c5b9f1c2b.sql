-- Create client_history table for tracking client interactions
CREATE TABLE public.client_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security on client_history table
ALTER TABLE public.client_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own client history
CREATE POLICY "Users can manage client history for their clients" 
ON public.client_history 
FOR ALL 
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);