-- Fix the promote_user_to_admin function to have proper search_path
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$;