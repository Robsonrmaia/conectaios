-- Fix admin user creation by ensuring proper email and authentication
-- First check if admin user exists and update/create as needed

-- Update existing admin profile if it exists but with wrong email
UPDATE profiles 
SET 
  nome = 'Administrador',
  role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@conectaios.com.br'
);

-- If no admin profile exists, we need to ensure the admin user in auth.users has the right email
-- This will be handled by the edge function that creates admin users