-- Criar view properties compatível com query existente
DROP VIEW IF EXISTS public.properties CASCADE;

CREATE VIEW public.properties AS
SELECT 
  i.id,
  i.title,
  i.title as titulo,
  i.description,
  i.description as descricao,
  i.price,
  i.price as valor,
  i.city,
  i.city as cidade,
  i.neighborhood,
  i.neighborhood as bairro,
  i.bedrooms,
  i.bathrooms,
  i.parking as parking_spots,
  i.area_built,
  i.area_total,
  i.type as property_type,
  i.purpose as listing_type,
  i.status,
  i.visibility,
  i.is_public,
  i.owner_id,
  i.created_at,
  i.updated_at,
  i.condo_fee as condominium_fee,
  i.iptu,
  i.zipcode,
  i.distancia_mar as sea_distance,
  i.vista_mar as has_sea_view,
  i.is_furnished as furnishing_type,
  NULL as banner_type,
  '[]'::jsonb as fotos,
  '[]'::jsonb as videos,
  NULL as raw_cnm,
  NULL as raw_vrsync,
  (
    SELECT img.url 
    FROM public.imovel_images img 
    WHERE img.imovel_id = i.id AND img.is_cover = true 
    ORDER BY img.created_at DESC 
    LIMIT 1
  ) as thumb_url
FROM public.imoveis i;