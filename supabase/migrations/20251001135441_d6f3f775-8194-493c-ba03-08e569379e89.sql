-- Configurar tabelas de chat para realtime

-- 1. Configurar REPLICA IDENTITY FULL para realtime
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_threads REPLICA IDENTITY FULL;
ALTER TABLE chat_participants REPLICA IDENTITY FULL;
ALTER TABLE chat_presence REPLICA IDENTITY FULL;
ALTER TABLE chat_receipts REPLICA IDENTITY FULL;

-- 2. Adicionar tabelas à publicação realtime do Supabase
DO $$ 
BEGIN
  -- Adiciona apenas se não estiver na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_threads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_presence;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_receipts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_receipts;
  END IF;
END $$;

-- 3. Limpar políticas RLS duplicadas em chat_messages (mantendo messages_participants)
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_read" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_thread_participants" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert_sender_is_participant" ON chat_messages;
DROP POLICY IF EXISTS "messages_select_participant" ON chat_messages;

-- 4. Limpar políticas duplicadas em chat_threads (mantendo threads_select_participant)
DROP POLICY IF EXISTS "chat_threads_participants" ON chat_threads;
DROP POLICY IF EXISTS "chat_threads_participants_read" ON chat_threads;
DROP POLICY IF EXISTS "threads_insert_owner" ON chat_threads;
DROP POLICY IF EXISTS "threads_participants" ON chat_threads;

-- 5. Adicionar política de insert para threads se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_threads' AND policyname = 'threads_insert_creator'
  ) THEN
    CREATE POLICY "threads_insert_creator"
    ON chat_threads
    FOR INSERT
    WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- 6. Limpar políticas duplicadas em chat_participants
DROP POLICY IF EXISTS "participants_insert_self_only" ON chat_participants;
DROP POLICY IF EXISTS "participants_select_direct_own" ON chat_participants;
DROP POLICY IF EXISTS "participants_select_via_function" ON chat_participants;
DROP POLICY IF EXISTS "participants_update_self_only" ON chat_participants;

-- 7. Adicionar política de insert para participants se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_participants' AND policyname = 'participants_insert_member'
  ) THEN
    CREATE POLICY "participants_insert_member"
    ON chat_participants
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM chat_threads t
        WHERE t.id = thread_id AND t.created_by = auth.uid()
      )
    );
  END IF;
END $$;

-- 8. Limpar e recriar políticas para chat_presence
DROP POLICY IF EXISTS "chat_presence_user_access" ON chat_presence;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_presence' AND policyname = 'presence_own_access'
  ) THEN
    CREATE POLICY "presence_own_access"
    ON chat_presence
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_presence' AND policyname = 'presence_read_all'
  ) THEN
    CREATE POLICY "presence_read_all"
    ON chat_presence
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- 9. Limpar políticas duplicadas em chat_receipts
DROP POLICY IF EXISTS "chat_receipts_participant_access" ON chat_receipts;
DROP POLICY IF EXISTS "receipts_participants" ON chat_receipts;