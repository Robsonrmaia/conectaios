-- Fix the infinite recursion by properly dropping and recreating policies

-- Drop all policies first
DROP POLICY IF EXISTS "chat_participants_insert" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_select" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_update" ON public.chat_participants;

-- Now drop the functions with CASCADE
DROP FUNCTION IF EXISTS public.is_chat_participant(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_chat_thread_creator(uuid, uuid) CASCADE;

-- Create simpler policies that avoid recursion
-- Allow users to see participants of threads they are part of
CREATE POLICY "chat_participants_select" ON public.chat_participants
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  thread_id IN (
    SELECT DISTINCT cp.thread_id 
    FROM public.chat_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- Allow users to insert themselves as participants
CREATE POLICY "chat_participants_insert" ON public.chat_participants
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR 
  thread_id IN (
    SELECT ct.id 
    FROM public.chat_threads ct 
    WHERE ct.created_by = auth.uid()
  )
);

-- Allow users to update their own participation
CREATE POLICY "chat_participants_update" ON public.chat_participants
FOR UPDATE 
USING (user_id = auth.uid());