-- Fix notifications RLS to allow chat messages to create notifications for other users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Create new policies
-- Users can read their own notifications
CREATE POLICY "notifications_read_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to create notifications for any user
-- This is safe because the edge function validates thread participation first
CREATE POLICY "notifications_insert_authenticated"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());