-- Drop the existing function and recreate it properly
DROP FUNCTION IF EXISTS create_admin_user();

-- Create a simpler function to ensure admin profile exists
CREATE OR REPLACE FUNCTION ensure_admin_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
    result json;
BEGIN
    -- Check if admin profile already exists
    SELECT user_id INTO admin_user_id
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        result := json_build_object(
            'success', true,
            'message', 'Admin profile already exists',
            'user_id', admin_user_id,
            'email', 'admin@conectaios.com.br',
            'password', 'admin123'
        );
        RETURN result;
    END IF;
    
    -- Create admin profile with specific UUID that matches auth user
    admin_user_id := '118c5166-0430-4c27-a04d-1775a5d83acd'::uuid;
    
    INSERT INTO profiles (user_id, nome, role)
    VALUES (
        admin_user_id,
        'Administrador Sistema',
        'admin'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        nome = 'Administrador Sistema';
    
    result := json_build_object(
        'success', true,
        'message', 'Admin profile created successfully',
        'user_id', admin_user_id,
        'email', 'admin@conectaios.com.br',
        'password', 'admin123'
    );
    
    RETURN result;
END;
$$;