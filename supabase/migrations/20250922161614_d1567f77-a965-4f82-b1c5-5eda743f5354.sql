-- Fix the infinite recursion by simplifying the RLS policies
-- The issue is that the functions still query the same table, causing recursion

-- Drop the problematic functions
DROP FUNCTION IF EXISTS public.is_chat_participant(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_chat_thread_creator(uuid, uuid);

-- Drop existing policies
DROP POLICY IF EXISTS "chat_participants_insert" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_select" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_update" ON public.chat_participants;

-- Create simpler policies that don't cause recursion
CREATE POLICY "chat_participants_insert" ON public.chat_participants
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_select" ON public.chat_participants
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "chat_participants_update" ON public.chat_participants
FOR UPDATE 
USING (user_id = auth.uid());