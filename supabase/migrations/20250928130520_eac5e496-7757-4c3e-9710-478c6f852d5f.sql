-- Corrigindo a view properties existente que está causando conflito
DROP VIEW IF EXISTS public.properties CASCADE;

-- Recriando as views necessárias para compatibilidade
CREATE VIEW public.properties AS
SELECT
  i.id,
  i.title,
  i.description,
  i.price,
  i.city,
  i.neighborhood,
  i.state,
  i.zipcode,
  i.street,
  i.number,
  i.type,
  i.purpose,
  i.bedrooms,
  i.bathrooms,
  i.suites,
  i.parking,
  i.area_total,
  i.area_built,
  i.condo_fee,
  i.iptu,
  i.is_furnished,
  i.vista_mar,
  i.distancia_mar,
  i.is_public,
  i.visibility,
  i.status,
  i.owner_id,
  i.created_at,
  i.updated_at,
  (
    SELECT img.url
    FROM public.imovel_images img
    WHERE img.imovel_id = i.id AND img.is_cover = true
    ORDER BY img.created_at DESC
    LIMIT 1
  ) AS thumb_url
FROM public.imoveis i;

-- Função RPC admin_change_user_role (usada em SecureAdminUserManagement)
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  user_id_param uuid,
  new_role text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- Só admin pode executar
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RETURN false;
  END IF;
  
  -- Atualizar role do usuário
  UPDATE public.profiles 
  SET role = new_role::user_role 
  WHERE id = user_id_param;
  
  RETURN FOUND;
END;
$$;