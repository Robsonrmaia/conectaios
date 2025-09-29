-- Garantir RLS habilitado (já deve estar, mas deixo explícito)
ALTER TABLE public.chat_threads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_receipts     ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura/escrita (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='chat_threads' AND policyname='chat_threads_participants_read'
  ) THEN
    CREATE POLICY chat_threads_participants_read ON public.chat_threads
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.chat_participants p
        WHERE p.thread_id = chat_threads.id
          AND p.user_id = auth.uid()
          AND p.left_at IS NULL
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='chat_messages_read'
  ) THEN
    CREATE POLICY chat_messages_read ON public.chat_messages
    FOR SELECT TO authenticated
    USING (
      thread_id IN (
        SELECT thread_id FROM public.chat_participants
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='chat_messages_insert'
  ) THEN
    CREATE POLICY chat_messages_insert ON public.chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (
      sender_id = auth.uid()
      AND thread_id IN (
        SELECT thread_id FROM public.chat_participants
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    );
  END IF;
END $$;

-- Único por participante (deve existir; garante sem duplicar)
CREATE UNIQUE INDEX IF NOT EXISTS ux_chat_participant_unique
  ON public.chat_participants (thread_id, user_id);

-- 🔹 RPC 1: iniciar (ou retornar) thread 1-para-1
CREATE OR REPLACE FUNCTION public.start_or_get_thread(target_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  t_id uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF target_user IS NULL OR target_user = me THEN
    RAISE EXCEPTION 'invalid target';
  END IF;

  -- já existe thread 1-1 ativa?
  SELECT t.id INTO t_id
  FROM public.chat_threads t
  WHERE t.is_group = false
    AND EXISTS (SELECT 1 FROM public.chat_participants p WHERE p.thread_id=t.id AND p.user_id = me         AND p.left_at IS NULL)
    AND EXISTS (SELECT 1 FROM public.chat_participants p WHERE p.thread_id=t.id AND p.user_id = target_user AND p.left_at IS NULL)
    AND (
      SELECT count(*) FROM public.chat_participants p WHERE p.thread_id=t.id AND p.left_at IS NULL
    ) = 2
  LIMIT 1;

  -- se não existe, cria
  IF t_id IS NULL THEN
    INSERT INTO public.chat_threads (is_group, created_by)
    VALUES (false, me)
    RETURNING id INTO t_id;

    INSERT INTO public.chat_participants (thread_id, user_id, role)
    VALUES (t_id, me, 'member'),
           (t_id, target_user, 'member')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN t_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_or_get_thread(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_or_get_thread(uuid) TO authenticated;

-- 🔹 RPC 2: enviar mensagem (com verificação de participação)
CREATE OR REPLACE FUNCTION public.send_message(p_thread_id uuid, p_body text, p_reply_to uuid DEFAULT NULL)
RETURNS public.chat_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  m public.chat_messages;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE thread_id = p_thread_id AND user_id = me AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  INSERT INTO public.chat_messages (thread_id, sender_id, body, reply_to_id)
  VALUES (p_thread_id, me, p_body, p_reply_to)
  RETURNING * INTO m;

  RETURN m;
END;
$$;

REVOKE ALL ON FUNCTION public.send_message(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text, uuid) TO authenticated;