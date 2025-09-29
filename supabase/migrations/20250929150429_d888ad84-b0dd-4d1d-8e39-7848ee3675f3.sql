-- 1. função para achar thread 1:1 existente
CREATE OR REPLACE FUNCTION public.find_existing_one_to_one_thread(user_a uuid, user_b uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.id
  FROM public.chat_threads t
  WHERE t.is_group = false
    AND EXISTS (SELECT 1 FROM public.chat_participants p WHERE p.thread_id=t.id AND p.user_id=user_a AND p.left_at IS NULL)
    AND EXISTS (SELECT 1 FROM public.chat_participants p WHERE p.thread_id=t.id AND p.user_id=user_b AND p.left_at IS NULL)
    AND (SELECT count(*) FROM public.chat_participants p WHERE p.thread_id=t.id AND p.left_at IS NULL) = 2
  LIMIT 1;
$$;

-- 2. políticas (se faltarem). Mantém o padrão: participante lê/escreve
ALTER TABLE public.chat_threads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages     ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_threads' AND policyname='chat_threads_participants') THEN
    CREATE POLICY chat_threads_participants ON public.chat_threads
      FOR ALL USING ( id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid()) );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_participants' AND policyname='chat_participants_member_access') THEN
    CREATE POLICY chat_participants_member_access ON public.chat_participants
      FOR ALL USING ( user_id = auth.uid()
                      OR thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid()) );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='chat_messages_thread_participants') THEN
    CREATE POLICY chat_messages_thread_participants ON public.chat_messages
      FOR ALL USING ( thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid()) );
  END IF;
END $$;