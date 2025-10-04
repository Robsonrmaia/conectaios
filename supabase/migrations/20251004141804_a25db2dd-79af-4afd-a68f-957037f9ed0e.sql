-- Drop existing properties view if exists
DROP VIEW IF EXISTS public.properties CASCADE;

-- Create new properties view with all necessary fields from imoveis
CREATE OR REPLACE VIEW public.properties AS
SELECT 
  i.id,
  i.owner_id,
  i.title,
  i.description,
  i.type,
  i.purpose,
  i.status,
  i.price,
  i.condo_fee,
  i.iptu,
  i.is_furnished,
  i.area_total,
  i.area_built,
  i.area_privativa,
  i.bedrooms,
  i.bathrooms,
  i.suites,
  i.parking,
  i.address,
  i.street,
  i.number,
  i.neighborhood,
  i.city,
  i.state,
  i.zipcode,
  i.latitude,
  i.longitude,
  i.vista_mar,
  i.distancia_mar,
  i.construction_year,
  i.is_public,
  i.visibility,
  i.show_on_site,
  i.show_on_marketplace,
  i.show_on_minisite,
  i.source,
  i.external_id,
  i.listing_type,
  i.property_type,
  i.search_vector,
  i.norm_title,
  i.created_at,
  i.updated_at
FROM public.imoveis i;

-- Grant appropriate permissions to the view
GRANT SELECT ON public.properties TO anon, authenticated;

-- Create comment for documentation
COMMENT ON VIEW public.properties IS 'Unified view of imoveis table with all fields for compatibility and marketplace functionality';