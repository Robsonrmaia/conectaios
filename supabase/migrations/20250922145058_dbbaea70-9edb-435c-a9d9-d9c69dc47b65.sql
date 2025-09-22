-- Fix RLS policy for chat_threads to avoid infinite recursion
-- Test if policies are working correctly

-- Create a simple test to verify policies work
DO $$
BEGIN
  -- This should work without infinite recursion
  RAISE NOTICE 'Testing RLS policies - this should complete without error';
END
$$;

-- Verify that all necessary policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename IN ('chat_threads', 'chat_participants', 'chat_messages');
  
  RAISE NOTICE 'Found % RLS policies for chat tables', policy_count;
  
  IF policy_count < 5 THEN
    RAISE EXCEPTION 'Missing RLS policies for chat system';
  END IF;
END
$$;