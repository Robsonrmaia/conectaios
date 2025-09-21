-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages in threads they participate in" 
ON public.messages 
FOR SELECT 
USING (
  thread_id IN (
    SELECT id FROM public.threads 
    WHERE auth.uid() = ANY(participants)
  )
);

CREATE POLICY "Users can insert messages to threads they participate in" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  thread_id IN (
    SELECT id FROM public.threads 
    WHERE auth.uid() = ANY(participants)
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();