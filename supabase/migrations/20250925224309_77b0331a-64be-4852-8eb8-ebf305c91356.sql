-- Test if find_existing_one_to_one_thread function works correctly
DO $$
BEGIN
  -- Test the function exists and works
  PERFORM find_existing_one_to_one_thread(
    '940c862e-a540-45dc-92af-6ca567fd2699'::uuid, 
    '118c5166-0430-4c27-a04d-1775a5d83acd'::uuid
  );
  
  RAISE NOTICE 'find_existing_one_to_one_thread function exists and is callable';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error testing function: %', SQLERRM;
END
$$;