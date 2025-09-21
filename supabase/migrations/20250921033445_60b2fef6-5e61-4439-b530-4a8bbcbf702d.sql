-- Limpar e recriar tabela messages com estrutura correta
DROP TABLE IF EXISTS public.messages CASCADE;

-- Criar tabela messages com estrutura limpa
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Brokers can view messages in their threads" 
ON public.messages 
FOR SELECT 
USING (
  thread_id IN (
    SELECT id FROM public.threads 
    WHERE (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid()) = ANY(participants)
  )
);

CREATE POLICY "Brokers can create messages in their threads" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  thread_id IN (
    SELECT id FROM public.threads 
    WHERE (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid()) = ANY(participants)
  )
);

-- Trigger para notify
CREATE OR REPLACE FUNCTION notify_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'message_inserted',
    json_build_object(
      'thread_id', NEW.thread_id,
      'sender_name', NEW.sender_name,
      'content', NEW.content
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;