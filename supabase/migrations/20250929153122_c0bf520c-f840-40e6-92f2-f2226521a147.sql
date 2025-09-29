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

-- chat_threads policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_threads' AND policyname='threads_select_participant') THEN
    CREATE POLICY threads_select_participant ON public.chat_threads
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.chat_participants p
        WHERE p.thread_id = chat_threads.id AND p.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_threads' AND policyname='threads_insert_owner') THEN
    CREATE POLICY threads_insert_owner ON public.chat_threads
      FOR INSERT WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- chat_participants policies  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_participants' AND policyname='participants_select_self') THEN
    CREATE POLICY participants_select_self ON public.chat_participants
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_participants' AND policyname='participants_insert_self') THEN
    CREATE POLICY participants_insert_self ON public.chat_participants
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- chat_messages policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='messages_select_participant') THEN
    CREATE POLICY messages_select_participant ON public.chat_messages
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.chat_participants p
        WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='messages_insert_sender_is_participant') THEN
    CREATE POLICY messages_insert_sender_is_participant ON public.chat_messages
      FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND EXISTS (
          SELECT 1 FROM public.chat_participants p
          WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;