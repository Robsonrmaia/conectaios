-- Create a test user function for debugging
CREATE OR REPLACE FUNCTION public.get_test_users()
RETURNS TABLE(user_id uuid, email text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    '940c862e-a540-45dc-92af-6ca567fd2699'::uuid as user_id,
    'user1@test.com'::text as email
  UNION ALL
  SELECT 
    '118c5166-0430-4c27-a04d-1775a5d83acd'::uuid as user_id,
    'admin@conectaios.com.br'::text as email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;