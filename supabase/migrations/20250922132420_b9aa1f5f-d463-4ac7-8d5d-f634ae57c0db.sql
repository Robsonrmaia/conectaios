-- Chat messaging system - Simplified migration
DROP TABLE IF EXISTS public.chat_threads_old CASCADE;
DROP TABLE IF EXISTS public.chat_messages_old CASCADE;

-- Rename existing tables
ALTER TABLE IF EXISTS public.threads RENAME TO chat_threads_backup;
ALTER TABLE IF EXISTS public.messages RENAME TO chat_messages_backup;

-- 1.1 Chat Threads
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  title text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Chat Participants  
CREATE TABLE public.chat_participants (
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (thread_id, user_id)
);

-- 1.3 Chat Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  reply_to_id uuid REFERENCES public.chat_messages(id)
);

-- 1.4 Message Receipts
CREATE TABLE public.chat_receipts (
  thread_id uuid NOT NULL,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, message_id, user_id, status)
);

-- 1.5 User Presence
CREATE TABLE public.chat_presence (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'online',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  typing_in_thread uuid REFERENCES public.chat_threads(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Migrate existing data if backup tables exist
INSERT INTO public.chat_threads (id, is_group, title, created_by, created_at)
SELECT 
  id, 
  (type = 'group') as is_group,
  title,
  created_by,
  created_at
FROM public.chat_threads_backup
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_threads_backup' AND table_schema = 'public')
ON CONFLICT (id) DO NOTHING;

-- Migrate participants - simplified approach
INSERT INTO public.chat_participants (thread_id, user_id, role, joined_at)
SELECT 
  t.id as thread_id,
  t.created_by as user_id,
  'admin' as role,
  t.created_at as joined_at
FROM public.chat_threads_backup t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_threads_backup' AND table_schema = 'public')
ON CONFLICT (thread_id, user_id) DO NOTHING;

-- Migrate messages
INSERT INTO public.chat_messages (id, thread_id, sender_id, body, created_at)
SELECT 
  id,
  thread_id,
  user_id as sender_id,
  content as body,
  created_at
FROM public.chat_messages_backup
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages_backup' AND table_schema = 'public')
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at DESC);
CREATE INDEX idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX idx_chat_participants_thread ON public.chat_participants(thread_id);
CREATE INDEX idx_chat_receipts_user ON public.chat_receipts(user_id);
CREATE INDEX idx_chat_presence_updated ON public.chat_presence(updated_at);

-- Enable RLS
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY chat_threads_select ON public.chat_threads
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_threads.id AND p.user_id = auth.uid() AND p.left_at IS NULL
));

CREATE POLICY chat_threads_insert ON public.chat_threads
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY chat_participants_select ON public.chat_participants
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid() AND p.left_at IS NULL
));

CREATE POLICY chat_participants_insert ON public.chat_participants
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_threads t 
    WHERE t.id = chat_participants.thread_id AND t.created_by = auth.uid()
  )
);

CREATE POLICY chat_messages_select ON public.chat_messages
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid() AND p.left_at IS NULL
));

CREATE POLICY chat_messages_insert ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.chat_participants p
    WHERE p.thread_id = chat_messages.thread_id AND p.user_id = auth.uid() AND p.left_at IS NULL
  )
);

CREATE POLICY chat_receipts_all ON public.chat_receipts
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_receipts.thread_id AND p.user_id = auth.uid() AND p.left_at IS NULL
));

CREATE POLICY chat_presence_self ON public.chat_presence
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION public.update_chat_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_threads 
  SET updated_at = now() 
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_thread_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_thread_timestamp();