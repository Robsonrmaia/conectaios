-- POLÍTICAS RLS PARA SISTEMA DE CHAT (corrigindo erro de sintaxe)
-- Remover policies existentes e recriar corretamente

-- THREADS
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_threads_select ON public.chat_threads;
DROP POLICY IF EXISTS chat_threads_insert ON public.chat_threads;

CREATE POLICY chat_threads_select
ON public.chat_threads FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_threads.id AND p.user_id = auth.uid()
));

CREATE POLICY chat_threads_insert
ON public.chat_threads FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- PARTICIPANTES
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_participants_select ON public.chat_participants;
DROP POLICY IF EXISTS chat_participants_insert ON public.chat_participants;

CREATE POLICY chat_participants_select
ON public.chat_participants FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid()
));

CREATE POLICY chat_participants_insert
ON public.chat_participants FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND EXISTS(
    SELECT 1 FROM public.chat_threads t
    WHERE t.id = chat_participants.thread_id AND t.created_by = auth.uid()
  ))
  OR
  EXISTS (
    SELECT 1 FROM public.chat_participants p
    WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid()
  )
);