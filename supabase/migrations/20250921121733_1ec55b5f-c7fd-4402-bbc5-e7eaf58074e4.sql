-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender_name TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Brokers can read messages from their threads" 
ON public.messages FOR SELECT 
USING (
  thread_id IN (
    SELECT id FROM public.threads 
    WHERE (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid()) = ANY(participants)
  )
);

CREATE POLICY "Brokers can insert messages to their threads" 
ON public.messages FOR INSERT 
WITH CHECK (
  thread_id IN (
    SELECT id FROM public.threads 
    WHERE (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid()) = ANY(participants)
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Brokers can update their own messages" 
ON public.messages FOR UPDATE 
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Update threads table for realtime
ALTER TABLE public.threads REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.threads;