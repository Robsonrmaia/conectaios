-- Criar função para admin user se não existir
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Verificar se já existe um usuário admin
    SELECT user_id INTO admin_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Se não existe, criar um novo perfil admin
    -- Assumindo que o usuário com email 'admin' já existe no auth.users
    IF admin_user_id IS NULL THEN
        -- Buscar o ID do usuário com email 'admin' se existir
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'admin' 
        LIMIT 1;
        
        -- Se encontrou o usuário, criar o perfil admin
        IF admin_user_id IS NOT NULL THEN
            INSERT INTO profiles (user_id, nome, role)
            VALUES (admin_user_id, 'Administrador', 'admin')
            ON CONFLICT (user_id) 
            DO UPDATE SET role = 'admin', nome = 'Administrador';
        END IF;
    END IF;
END;
$$;

-- Executar a função
SELECT create_admin_user();