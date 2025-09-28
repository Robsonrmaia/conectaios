-- Primeiro, dropar a view existente se ela existir
DROP VIEW IF EXISTS public.properties;

-- Agora criar a view de compatibilidade: properties -> imoveis + capa
CREATE VIEW public.properties AS
SELECT
  i.id,
  i.owner_id,
  i.title as titulo,
  i.description as descricao,
  i.price as valor,
  i.area_total as area,
  i.bedrooms as quartos,
  i.bathrooms,
  i.parking as parking_spots,
  i.city,
  i.neighborhood,
  i.is_public,
  i.visibility,
  i.created_at,
  i.updated_at,
  i.zipcode,
  i.condo_fee as condominium_fee,
  i.iptu,
  i.purpose as listing_type,
  i.type as property_type,
  i.is_furnished,
  i.vista_mar as has_sea_view,
  i.distancia_mar as sea_distance,
  -- Capa do imóvel (pode ser null)
  (SELECT ii.url
     FROM public.imovel_images ii
    WHERE ii.imovel_id = i.id AND ii.is_cover = true
    ORDER BY ii.created_at DESC
    LIMIT 1) as thumb_url,
  -- Fotos como array JSON
  COALESCE((
    SELECT json_agg(ii.url ORDER BY ii.position, ii.created_at)
    FROM public.imovel_images ii
    WHERE ii.imovel_id = i.id
  ), '[]'::json) as fotos,
  -- Videos como array vazio por enquanto
  '[]'::json as videos,
  i.owner_id as user_id
FROM public.imoveis i;