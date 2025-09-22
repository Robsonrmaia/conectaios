-- Chat messaging system complete implementation
-- Renaming existing tables to follow chat_ pattern and adding missing functionality

-- First, rename existing tables to follow chat_ naming convention
ALTER TABLE IF EXISTS public.threads RENAME TO chat_threads_old;
ALTER TABLE IF EXISTS public.messages RENAME TO chat_messages_old;

-- 1.1 Chat Threads (conversations)
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  title text,                    -- optional for groups
  created_by uuid NOT NULL,      -- auth.users.id
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Chat Participants
CREATE TABLE IF NOT EXISTS public.chat_participants (
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,  -- auth.users.id
  role text DEFAULT 'member', -- 'member' | 'admin'
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (thread_id, user_id)
);

-- 1.3 Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,  -- auth.users.id
  body text,                -- message text
  attachments jsonb DEFAULT '[]'::jsonb, -- [{name,url,size,contentType}]
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  reply_to_id uuid REFERENCES public.chat_messages(id)
);

-- 1.4 Message Receipts (delivery/read status)
CREATE TABLE IF NOT EXISTS public.chat_receipts (
  thread_id uuid NOT NULL,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- who read/received
  status text NOT NULL,  -- 'delivered' | 'read'
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, message_id, user_id, status)
);

-- 1.5 User Presence and Typing
CREATE TABLE IF NOT EXISTS public.chat_presence (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'online', -- 'online'|'offline'|'away'
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  typing_in_thread uuid REFERENCES public.chat_threads(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.6 Enhanced Notifications (extending existing if it exists)
ALTER TABLE IF EXISTS public.notifications 
ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- If notifications table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,     -- ex: 'chat:new_message'
  title text,
  body text,
  meta jsonb DEFAULT '{}'::jsonb, -- {thread_id, message_id, sender_id}
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.7 Useful Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_thread ON public.chat_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_receipts_user ON public.chat_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_updated ON public.chat_presence(updated_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false;

-- Migrate data from old tables if they exist
INSERT INTO public.chat_threads (id, is_group, title, created_by, created_at)
SELECT 
  id, 
  (type = 'group') as is_group,
  title,
  created_by,
  created_at
FROM public.chat_threads_old
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_threads_old')
ON CONFLICT (id) DO NOTHING;

-- Migrate participants from old threads table
INSERT INTO public.chat_participants (thread_id, user_id, role, joined_at)
SELECT 
  t.id as thread_id,
  unnest(t.participants) as user_id,
  CASE WHEN unnest(t.participants) = t.created_by THEN 'admin' ELSE 'member' END as role,
  t.created_at as joined_at
FROM public.chat_threads_old t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_threads_old')
  AND t.participants IS NOT NULL
ON CONFLICT (thread_id, user_id) DO NOTHING;

-- Migrate messages
INSERT INTO public.chat_messages (id, thread_id, sender_id, body, created_at)
SELECT 
  id,
  thread_id,
  user_id as sender_id,
  content as body,
  created_at
FROM public.chat_messages_old
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages_old')
ON CONFLICT (id) DO NOTHING;

-- Drop old tables after migration
DROP TABLE IF EXISTS public.chat_threads_old CASCADE;
DROP TABLE IF EXISTS public.chat_messages_old CASCADE;

-- RLS Policies
-- Enable RLS on all tables
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Chat Threads Policies
CREATE POLICY chat_threads_select ON public.chat_threads
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_threads.id AND p.user_id = auth.uid()
));

CREATE POLICY chat_threads_insert ON public.chat_threads
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY chat_threads_update ON public.chat_threads
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_threads.id AND p.user_id = auth.uid() AND p.role = 'admin'
));

-- Chat Participants Policies
CREATE POLICY chat_participants_select ON public.chat_participants
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid()
));

CREATE POLICY chat_participants_insert ON public.chat_participants
FOR INSERT TO authenticated
WITH CHECK (
  -- Creator can add participants when creating thread
  (EXISTS (
    SELECT 1 FROM public.chat_threads t 
    WHERE t.id = chat_participants.thread_id AND t.created_by = auth.uid()
  )) OR
  -- Admin can add participants
  (EXISTS (
    SELECT 1 FROM public.chat_participants p
    WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid() AND p.role = 'admin'
  ))
);

CREATE POLICY chat_participants_update ON public.chat_participants
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR  -- Users can update their own participation
  EXISTS (
    SELECT 1 FROM public.chat_participants p
    WHERE p.thread_id = chat_participants.thread_id AND p.user_id = auth.uid() AND p.role = 'admin'
  )
);

-- Chat Messages Policies
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

CREATE POLICY chat_messages_update ON public.chat_messages
FOR UPDATE TO authenticated
USING (sender_id = auth.uid());

-- Chat Receipts Policies
CREATE POLICY chat_receipts_all ON public.chat_receipts
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_receipts.thread_id AND p.user_id = auth.uid() AND p.left_at IS NULL
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_participants p
  WHERE p.thread_id = chat_receipts.thread_id AND p.user_id = auth.uid() AND p.left_at IS NULL
));

-- Chat Presence Policies
CREATE POLICY chat_presence_self ON public.chat_presence
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY chat_presence_read_others ON public.chat_presence
FOR SELECT TO authenticated
USING (
  -- Can see presence of users in same threads
  EXISTS (
    SELECT 1 FROM public.chat_participants p1
    JOIN public.chat_participants p2 ON p1.thread_id = p2.thread_id
    WHERE p1.user_id = auth.uid() AND p2.user_id = chat_presence.user_id
      AND p1.left_at IS NULL AND p2.left_at IS NULL
  )
);

-- Notifications Policies
CREATE POLICY notifications_self_read ON public.notifications
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY notifications_self_write ON public.notifications
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_self_update ON public.notifications
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

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

-- Trigger to update thread timestamp when new message is added
CREATE TRIGGER update_thread_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_thread_timestamp();

-- Function to get thread participants with user info
CREATE OR REPLACE FUNCTION public.get_thread_participants(thread_uuid uuid)
RETURNS TABLE (
  user_id uuid,
  role text,
  joined_at timestamptz,
  name text,
  avatar_url text
) 
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.user_id,
    cp.role,
    cp.joined_at,
    COALESCE(cb.name, p.nome, 'Unknown User') as name,
    cb.avatar_url
  FROM public.chat_participants cp
  LEFT JOIN public.conectaios_brokers cb ON cb.user_id = cp.user_id
  LEFT JOIN public.profiles p ON p.user_id = cp.user_id
  WHERE cp.thread_id = thread_uuid AND cp.left_at IS NULL
  ORDER BY cp.joined_at;
$$;

-- Function to get unread message count per thread
CREATE OR REPLACE FUNCTION public.get_unread_count(thread_uuid uuid, for_user_id uuid)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.chat_messages cm
  WHERE cm.thread_id = thread_uuid
    AND cm.sender_id != for_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_receipts cr
      WHERE cr.message_id = cm.id 
        AND cr.user_id = for_user_id 
        AND cr.status = 'read'
    );
$$;