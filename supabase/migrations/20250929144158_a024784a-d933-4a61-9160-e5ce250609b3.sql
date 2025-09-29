-- Tabelas base (cria apenas se não existirem)
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  is_group boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  UNIQUE (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text,
  attachments jsonb DEFAULT '[]'::jsonb,
  reply_to_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'delivered', -- 'delivered' | 'seen'
  created_at timestamptz DEFAULT now(),
  UNIQUE (thread_id, message_id, user_id, status)
);

-- FKs (apenas se faltar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_participants_thread') THEN
    ALTER TABLE public.chat_participants
      ADD CONSTRAINT fk_participants_thread
      FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_messages_thread') THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT fk_messages_thread
      FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_receipts_thread') THEN
    ALTER TABLE public.chat_receipts
      ADD CONSTRAINT fk_receipts_thread
      FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_receipts_message') THEN
    ALTER TABLE public.chat_receipts
      ADD CONSTRAINT fk_receipts_message
      FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Trigger updated_at genérica e attaches
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$BEGIN NEW.updated_at = now(); RETURN NEW; END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_threads_updated') THEN
    CREATE TRIGGER tg_threads_updated BEFORE UPDATE ON public.chat_threads
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_messages_updated') THEN
    CREATE TRIGGER tg_messages_updated BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW EXECUTE PROCEDURE public.fn_set_updated_at();
  END IF;
END $$;

-- RLS (participante do tópico tem acesso)
ALTER TABLE public.chat_threads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_receipts     ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Threads: só participantes veem
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='threads_participants') THEN
    CREATE POLICY threads_participants ON public.chat_threads
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.chat_participants p
                WHERE p.thread_id = chat_threads.id
                  AND p.user_id = auth.uid()
                  AND p.left_at IS NULL)
      );
  END IF;

  -- Participants: o próprio user ou alguém do mesmo thread
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='participants_member') THEN
    CREATE POLICY participants_member ON public.chat_participants
      FOR SELECT USING (
        user_id = auth.uid() OR thread_id IN (
          SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid() AND left_at IS NULL
        )
      );
  END IF;

  -- Messages: apenas participantes do thread
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='messages_participants') THEN
    CREATE POLICY messages_participants ON public.chat_messages
      FOR ALL USING (
        thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid() AND left_at IS NULL)
      ) WITH CHECK (
        thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid() AND left_at IS NULL)
      );
  END IF;

  -- Receipts: idem
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='receipts_participants') THEN
    CREATE POLICY receipts_participants ON public.chat_receipts
      FOR ALL USING (
        thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid() AND left_at IS NULL)
      ) WITH CHECK (
        thread_id IN (SELECT thread_id FROM public.chat_participants WHERE user_id = auth.uid() AND left_at IS NULL)
      );
  END IF;
END $$;

-- Função utilitária: achar/criar thread 1:1 (segura e idempotente)
CREATE OR REPLACE FUNCTION public.find_or_create_dm(user_a uuid, user_b uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t uuid;
BEGIN
  SELECT t1.id INTO t
  FROM public.chat_threads t1
  WHERE t1.is_group = false
    AND EXISTS (SELECT 1 FROM public.chat_participants p1 WHERE p1.thread_id=t1.id AND p1.user_id=user_a AND p1.left_at IS NULL)
    AND EXISTS (SELECT 1 FROM public.chat_participants p2 WHERE p2.thread_id=t1.id AND p2.user_id=user_b AND p2.left_at IS NULL)
    AND (SELECT count(*) FROM public.chat_participants p3 WHERE p3.thread_id=t1.id AND p3.left_at IS NULL)=2
  LIMIT 1;

  IF t IS NOT NULL THEN
    RETURN t;
  END IF;

  INSERT INTO public.chat_threads (is_group, created_by) VALUES (false, user_a) RETURNING id INTO t;
  INSERT INTO public.chat_participants (thread_id, user_id) VALUES (t, user_a)
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  INSERT INTO public.chat_participants (thread_id, user_id) VALUES (t, user_b)
    ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN t;
END $$;