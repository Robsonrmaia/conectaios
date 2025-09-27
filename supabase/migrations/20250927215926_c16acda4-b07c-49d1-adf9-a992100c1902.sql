-- Create properties view for compatibility with thumb_url
CREATE OR REPLACE VIEW public.properties AS
SELECT
  i.id,
  i.title,
  i.description,
  i.purpose,
  i.price,
  i.city,
  i.neighborhood,
  i.is_public,
  i.visibility,
  i.owner_id,
  i.created_at,
  i.updated_at,
  i.type,
  i.status,
  i.bedrooms,
  i.bathrooms,
  i.area_total,
  i.area_built,
  -- Compatibility thumb_url field
  (
    SELECT img.url
    FROM public.imovel_images img
    WHERE img.imovel_id = i.id AND img.is_cover = true
    ORDER BY img.created_at DESC
    LIMIT 1
  ) AS thumb_url
FROM public.imoveis i;

-- Create legacy search_properties RPC function
CREATE OR REPLACE FUNCTION public.search_properties(
  q text DEFAULT '',
  city_filter text DEFAULT NULL,
  purpose_filter text DEFAULT NULL,
  limit_rows int DEFAULT 50,
  offset_rows int DEFAULT 0
) RETURNS SETOF public.imoveis
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.search_imoveis(q, city_filter, purpose_filter, limit_rows, offset_rows);
$$;

-- Create conectaios_brokers view for compatibility
CREATE OR REPLACE VIEW public.conectaios_brokers AS
SELECT
  b.id,
  b.user_id,
  p.name,
  p.email,
  b.creci,
  b.bio,
  b.whatsapp as phone,
  p.avatar_url,
  p.cover_url,
  'active' as status,
  'active' as subscription_status,
  NULL::timestamp with time zone as subscription_expires_at,
  NULL as referral_code,
  NULL as cpf_cnpj,
  NULL as plan_id,
  NULL as region_id,
  b.created_at,
  b.updated_at
FROM public.brokers b
LEFT JOIN public.profiles p ON p.id = b.user_id;