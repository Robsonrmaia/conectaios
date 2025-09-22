-- POLÍTICAS RLS PARA MENSAGENS E RECEIPTS + FUNÇÃO RPC

-- MENSAGENS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;

CREATE POLICY chat_messages_select
ON public.chat_messages FOR SELECT TO authenticated
USING (EXISTS(
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid()
));

CREATE POLICY chat_messages_insert
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND EXISTS(
    SELECT 1 FROM public.chat_participants p
    WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid()
  )
);

-- RECEIPTS
ALTER TABLE public.chat_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_receipts_rw ON public.chat_receipts;

CREATE POLICY chat_receipts_rw
ON public.chat_receipts FOR ALL TO authenticated
USING (EXISTS(
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_receipts.thread_id AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS(
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_receipts.thread_id AND p.user_id = auth.uid()
));

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);

-- RPC PARA OTIMIZAR BUSCA DE THREAD 1:1
CREATE OR REPLACE FUNCTION public.find_or_create_one_to_one_thread(a uuid, b uuid)
RETURNS TABLE(thread_id uuid)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE t uuid;
BEGIN
  -- procura thread com exatamente 2 participantes {a,b}
  SELECT cp.thread_id INTO t
  FROM public.chat_participants cp
  WHERE cp.user_id IN (a,b)
  GROUP BY cp.thread_id
  HAVING count(DISTINCT cp.user_id) = 2
  LIMIT 1;

  IF t IS NOT NULL THEN
    RETURN QUERY SELECT t AS thread_id;
  END IF;

  RETURN;
END $$;