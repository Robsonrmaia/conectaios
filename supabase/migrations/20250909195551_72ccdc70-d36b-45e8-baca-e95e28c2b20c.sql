-- Create admin user function that properly creates the admin user
CREATE OR REPLACE FUNCTION create_admin_user()
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
            'message', 'Admin user already exists',
            'user_id', admin_user_id
        );
        RETURN result;
    END IF;
    
    -- Insert admin profile with a known user_id
    -- We'll use a fixed UUID for the admin user
    admin_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
    
    INSERT INTO profiles (user_id, email, role, name, username, phone)
    VALUES (
        admin_user_id,
        'admin@conectaios.com.br',
        'admin',
        'Administrador',
        'admin',
        '11999999999'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        email = 'admin@conectaios.com.br',
        name = 'Administrador',
        username = 'admin',
        phone = '11999999999';
    
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