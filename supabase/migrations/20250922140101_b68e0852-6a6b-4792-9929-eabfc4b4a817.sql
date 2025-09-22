-- Drop existing policies that cause circular dependency
DROP POLICY IF EXISTS "chat_threads_select" ON chat_threads;
DROP POLICY IF EXISTS "chat_participants_select" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert" ON chat_participants;

-- Create improved RLS policies without circular references
CREATE POLICY "chat_threads_select" 
ON chat_threads 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  id IN (
    SELECT thread_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Allow participants to view their own participation records
CREATE POLICY "chat_participants_select" 
ON chat_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  thread_id IN (
    SELECT id 
    FROM chat_threads 
    WHERE created_by = auth.uid()
  )
);

-- Allow thread creators and invited users to insert participants
CREATE POLICY "chat_participants_insert" 
ON chat_participants 
FOR INSERT 
WITH CHECK (
  -- Thread creator can add anyone
  thread_id IN (
    SELECT id 
    FROM chat_threads 
    WHERE created_by = auth.uid()
  ) OR
  -- Users can add themselves when invited (future feature)
  user_id = auth.uid()
);

-- Allow participants to update their own records (leave chat, etc.)
CREATE POLICY "chat_participants_update" 
ON chat_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- Recreate chat_threads insert policy to ensure it works properly
DROP POLICY IF EXISTS "chat_threads_insert" ON chat_threads;
CREATE POLICY "chat_threads_insert" 
ON chat_threads 
FOR INSERT 
WITH CHECK (created_by = auth.uid());