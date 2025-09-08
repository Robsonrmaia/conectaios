-- Set the first user as admin (you'll need to update this with your actual user_id)
-- First, let's see who needs to be admin
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    -- Get the first user ID from profiles
    SELECT user_id INTO first_user_id 
    FROM profiles 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Update their role to admin if found
    IF first_user_id IS NOT NULL THEN
        UPDATE profiles 
        SET role = 'admin' 
        WHERE user_id = first_user_id;
        
        RAISE NOTICE 'Updated user % to admin role', first_user_id;
    END IF;
END $$;

-- Also create a function to promote users to admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$;