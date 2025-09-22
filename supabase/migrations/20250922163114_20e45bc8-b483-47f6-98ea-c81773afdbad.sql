-- Create a simplified RPC function to find existing 1:1 threads
CREATE OR REPLACE FUNCTION public.find_existing_one_to_one_thread(user_a uuid, user_b uuid)
RETURNS uuid AS $$
DECLARE
  thread_uuid uuid;
BEGIN
  -- Find threads where both users are participants and it's not a group
  SELECT ct.id INTO thread_uuid
  FROM public.chat_threads ct
  WHERE ct.is_group = false
    AND EXISTS (
      SELECT 1 FROM public.chat_participants cp1 
      WHERE cp1.thread_id = ct.id AND cp1.user_id = user_a
    )
    AND EXISTS (
      SELECT 1 FROM public.chat_participants cp2 
      WHERE cp2.thread_id = ct.id AND cp2.user_id = user_b
    )
    -- Ensure exactly 2 participants
    AND (
      SELECT COUNT(*) FROM public.chat_participants cp3 
      WHERE cp3.thread_id = ct.id
    ) = 2
  LIMIT 1;
  
  RETURN thread_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;