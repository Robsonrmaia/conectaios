-- Create security definer functions to avoid infinite recursion in RLS policies

-- Function to check if user is participant in a chat thread
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_thread_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE thread_id = p_thread_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if user created a chat thread
CREATE OR REPLACE FUNCTION public.is_chat_thread_creator(p_thread_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_threads 
    WHERE id = p_thread_id AND created_by = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "chat_participants_insert" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_select" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_update" ON public.chat_participants;

-- Recreate policies using security definer functions
CREATE POLICY "chat_participants_insert" ON public.chat_participants
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) OR 
  public.is_chat_thread_creator(thread_id, auth.uid()) OR
  public.is_chat_participant(thread_id, auth.uid())
);

CREATE POLICY "chat_participants_select" ON public.chat_participants
FOR SELECT 
USING (public.is_chat_participant(thread_id, auth.uid()));

CREATE POLICY "chat_participants_update" ON public.chat_participants
FOR UPDATE 
USING (user_id = auth.uid());