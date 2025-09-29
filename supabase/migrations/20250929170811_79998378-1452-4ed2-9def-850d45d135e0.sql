-- Verificar e adicionar colunas necessárias se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_threads' AND column_name = 'last_message_at') THEN
        ALTER TABLE chat_threads ADD COLUMN last_message_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'content') THEN
        ALTER TABLE chat_messages ADD COLUMN content text;
        UPDATE chat_messages SET content = body WHERE content IS NULL;
    END IF;
END $$;

-- RPCs para mensageria
CREATE OR REPLACE FUNCTION public.msg_create_or_get_direct(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  me uuid := auth.uid();
  existing uuid;
  new_thread uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF target_user_id = me THEN
    RAISE EXCEPTION 'cannot_create_chat_with_self';
  END IF;

  -- Procura thread direta existente (exatamente 2 participantes: me e target)
  SELECT ct.id INTO existing
  FROM chat_threads ct
  JOIN chat_participants p1 ON p1.thread_id = ct.id AND p1.user_id = me AND p1.left_at IS NULL
  JOIN chat_participants p2 ON p2.thread_id = ct.id AND p2.user_id = target_user_id AND p2.left_at IS NULL
  WHERE ct.is_group = false
    AND (SELECT COUNT(*) FROM chat_participants p WHERE p.thread_id = ct.id AND p.left_at IS NULL) = 2
  LIMIT 1;

  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;

  -- Cria nova thread
  INSERT INTO chat_threads (is_group, created_by, title, last_message_at)
  VALUES (false, me, null, now())
  RETURNING id INTO new_thread;

  -- adiciona participantes
  INSERT INTO chat_participants(thread_id, user_id, role)
  VALUES (new_thread, me, 'member'),
         (new_thread, target_user_id, 'member');

  RETURN new_thread;
END $$;

CREATE OR REPLACE FUNCTION public.msg_create_group(title text, participant_ids uuid[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  me uuid := auth.uid();
  new_thread uuid;
  u uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  INSERT INTO chat_threads (is_group, created_by, title, last_message_at)
  VALUES (true, me, COALESCE(title,'Grupo'), now())
  RETURNING id INTO new_thread;

  -- adiciona criador
  INSERT INTO chat_participants(thread_id, user_id, role)
  VALUES (new_thread, me, 'member');

  -- adiciona demais
  FOREACH u IN ARRAY participant_ids LOOP
    EXIT WHEN u IS NULL;
    IF u <> me THEN
      INSERT INTO chat_participants(thread_id, user_id, role)
      VALUES (new_thread, u, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN new_thread;
END $$;

CREATE OR REPLACE FUNCTION public.msg_send_message(thread_id uuid, content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  me uuid := auth.uid();
  mid uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- valida participação
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE thread_id = msg_send_message.thread_id AND user_id = me AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'not_a_participant';
  END IF;

  INSERT INTO chat_messages(thread_id, sender_id, body)
  VALUES (thread_id, me, content)
  RETURNING id INTO mid;

  UPDATE chat_threads SET last_message_at = now() WHERE id = thread_id;

  RETURN mid;
END $$;