-- Migration: Ajustar sistema de admin e limpar dados desnecessários

-- 1. Limpar usuário não confirmado (admin@conectaios.com.br)
DELETE FROM auth.users 
WHERE email = 'admin@conectaios.com.br' 
AND email_confirmed_at IS NULL;

-- 2. Remover profile órfão se existir
DELETE FROM public.profiles 
WHERE email = 'admin@conectaios.com.br' 
AND id NOT IN (SELECT id FROM auth.users);

-- 3. Atualizar trigger para promover social.conectaios@gmail.com automaticamente
CREATE OR REPLACE FUNCTION public.fn_promote_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Promover social.conectaios@gmail.com como admin principal
  IF NEW.email = 'social.conectaios@gmail.com' THEN
    UPDATE public.profiles SET role='admin' WHERE id=NEW.id;
  -- Caso contrário, promover apenas se não houver admin
  ELSIF (SELECT COUNT(*) FROM public.profiles WHERE role='admin') = 0 THEN
    UPDATE public.profiles SET role='admin' WHERE id=NEW.id;
  END IF;
  RETURN NEW;
END $$;

-- 4. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_profile_created_promote_first_admin ON public.profiles;
CREATE TRIGGER on_profile_created_promote_first_admin
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_promote_first_admin();