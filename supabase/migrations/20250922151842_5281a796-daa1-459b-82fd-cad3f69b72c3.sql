-- POLÍTICAS RLS COMPLETAS PARA SISTEMA DE CHAT
-- Implementação do patch para corrigir erro "Failed to create thread"

-- THREADS
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

-- Ver threads onde sou participante
CREATE POLICY IF NOT EXISTS chat_threads_select
ON public.chat_threads FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_threads.id AND p.user_id = auth.uid()
));

-- Criar thread (o criador é o usuário logado)
CREATE POLICY IF NOT EXISTS chat_threads_insert
ON public.chat_threads FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- PARTICIPANTES
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Ver participantes da thread onde participo
CREATE POLICY IF NOT EXISTS chat_participants_select
ON public.chat_participants FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid()
));

-- Inserir-me numa thread que eu acabei de criar OU já participo
CREATE POLICY IF NOT EXISTS chat_participants_insert
ON public.chat_participants FOR INSERT TO authenticated
WITH CHECK (
  -- posso me inserir quando eu sou o user e a thread é minha
  (user_id = auth.uid() AND EXISTS(
    SELECT 1 FROM public.chat_threads t
    WHERE t.id = chat_participants.thread_id AND t.created_by = auth.uid()
  ))
  OR
  -- ou já participo da thread e estou adicionando alguém (admin simplificado)
  EXISTS (
    SELECT 1 FROM public.chat_participants p
    WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid()
  )
);

-- MENSAGENS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Ver mensagens das threads onde participo
CREATE POLICY IF NOT EXISTS chat_messages_select
ON public.chat_messages FOR SELECT TO authenticated
USING (EXISTS(
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid()
));

-- Enviar mensagem apenas em threads onde participo
CREATE POLICY IF NOT EXISTS chat_messages_insert
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND EXISTS(
    SELECT 1 FROM public.chat_participants p
    WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid()
  )
);

-- RECEIPTS
ALTER TABLE public.chat_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS chat_receipts_rw
ON public.chat_receipts FOR ALL TO authenticated
USING (EXISTS(
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_receipts.thread_id AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS(
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_receipts.thread_id AND p.user_id = auth.uid()
));

-- ÍNDICES (performance)
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);

-- RPC para otimizar busca de thread 1:1
CREATE OR REPLACE FUNCTION public.find_or_create_one_to_one_thread(a uuid, b uuid)
RETURNS TABLE(thread_id uuid)
LANGUAGE plpgsql SECURITY DEFINER AS $$
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