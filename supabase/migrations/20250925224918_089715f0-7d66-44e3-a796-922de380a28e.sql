-- Fix Security Issues: Phase 1 - Fix RLS policies only

-- 1. Fix chat_presence RLS policies - Remove conflicting policies
DROP POLICY IF EXISTS "chat_presence_access" ON public.chat_presence;

-- Keep the more secure policy and rename it for clarity
ALTER POLICY "chat_presence_self" ON public.chat_presence 
RENAME TO "chat_presence_authenticated_only";

-- 2. Fix chat_participants infinite recursion by simplifying the SELECT policy
DROP POLICY IF EXISTS "chat_participants_select" ON public.chat_participants;

-- Create a simple, non-recursive policy for SELECT
CREATE POLICY "chat_participants_select_safe" 
ON public.chat_participants 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());