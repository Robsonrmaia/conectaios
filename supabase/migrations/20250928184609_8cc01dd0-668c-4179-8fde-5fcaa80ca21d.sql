-- Drop existing views and recreate with correct structure
DROP VIEW IF EXISTS properties;
DROP VIEW IF EXISTS banners;

-- Create new properties view with correct mapping
CREATE VIEW properties AS
SELECT 
  id,
  title,
  description,
  price,
  area_total as area,
  area_built,
  bedrooms,
  bathrooms,
  parking as parking_spots,
  type as property_type,
  purpose as listing_type,
  status,
  visibility,
  street as address,
  neighborhood,
  city,
  zipcode,
  condo_fee,
  iptu,
  created_at,
  updated_at,
  owner_id,
  -- Legacy compatibility fields
  title as titulo,
  description as descricao,
  condo_fee as condominium_fee,
  is_furnished as furnishing_type,
  distancia_mar as sea_distance,
  vista_mar as has_sea_view,
  -- Mock fields for compatibility
  '{}'::json as raw_cnm,
  '{}'::json as raw_vrsync,
  '[]'::json as fotos,
  '[]'::json as videos,
  'standard'::text as banner_type
FROM imoveis;

-- Create banners view
CREATE VIEW banners AS
SELECT 
  id,
  title,
  description,
  '/placeholder.svg' as image_url,
  true as is_active,
  1 as sort_order,
  created_at,
  updated_at
FROM imoveis 
WHERE is_public = true
LIMIT 10;