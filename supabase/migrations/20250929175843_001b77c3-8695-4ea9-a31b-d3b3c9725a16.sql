-- Garantir colunas auxiliares para DM único
ALTER TABLE public.chat_threads
ADD COLUMN IF NOT EXISTS a_user_id uuid,
ADD COLUMN IF NOT EXISTS b_user_id uuid;

-- Index/único para DM por par ordenado (evita duplicadas)
CREATE UNIQUE INDEX IF NOT EXISTS chat_threads_dm_unique_pair
ON public.chat_threads (LEAST(a_user_id, b_user_id), GREATEST(a_user_id, b_user_id))
WHERE is_group = false AND a_user_id IS NOT NULL AND b_user_id IS NOT NULL;

-- Participantes únicos por thread
CREATE UNIQUE INDEX IF NOT EXISTS chat_participants_unique
ON public.chat_participants (thread_id, user_id);

-- Atualizar threads DM existentes para preencher a_user_id e b_user_id
UPDATE public.chat_threads t
SET 
  a_user_id = (
    SELECT user_id FROM public.chat_participants p1 
    WHERE p1.thread_id = t.id 
    AND p1.left_at IS NULL
    ORDER BY user_id 
    LIMIT 1
  ),
  b_user_id = (
    SELECT user_id FROM public.chat_participants p2 
    WHERE p2.thread_id = t.id 
    AND p2.left_at IS NULL
    ORDER BY user_id DESC 
    LIMIT 1
  )
WHERE t.is_group = false AND t.a_user_id IS NULL;

-- View de threads com último texto
CREATE OR REPLACE VIEW public.chat_threads_view AS
SELECT
  t.id,
  CASE WHEN t.is_group THEN 'group'::text ELSE 'dm'::text END as type,
  t.last_message_at,
  t.title,
  t.is_group,
  t.created_at,
  t.updated_at,
  (SELECT m.body
     FROM public.chat_messages m
     WHERE m.thread_id = t.id
     ORDER BY m.created_at DESC
     LIMIT 1) AS last_text
FROM public.chat_threads t;