-- Fix the properties view and create proper policies
-- First drop the view completely then recreate it
DROP VIEW IF EXISTS public.properties;

-- Ensure imoveis has proper RLS
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly (ignore errors if they don't exist)
DO $$
BEGIN
  DROP POLICY IF EXISTS "imoveis_public_read" ON public.imoveis;
  DROP POLICY IF EXISTS "imoveis_owner_cud" ON public.imoveis;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Public read access for published properties
CREATE POLICY "imoveis_public_read" ON public.imoveis FOR SELECT
USING (is_public = true AND visibility = 'public_site');

-- Owner full access for their properties
CREATE POLICY "imoveis_owner_cud" ON public.imoveis FOR ALL
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Ensure imovel_images has proper RLS
ALTER TABLE public.imovel_images ENABLE ROW LEVEL SECURITY;

-- Drop existing image policies (ignore errors if they don't exist)
DO $$
BEGIN
  DROP POLICY IF EXISTS "images_owner_rw" ON public.imovel_images;
  DROP POLICY IF EXISTS "images_public_read" ON public.imovel_images;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Owner full access for images of their properties
CREATE POLICY "images_owner_rw" ON public.imovel_images FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id AND i.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id AND i.owner_id = auth.uid())
);

-- Public read access for images of public properties
CREATE POLICY "images_public_read" ON public.imovel_images FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id
            AND i.is_public = true AND i.visibility = 'public_site')
);

-- Recreate the properties view with proper compatibility
CREATE VIEW public.properties AS
SELECT
  i.id,
  i.title,
  i.description,
  i.city,
  i.neighborhood,
  i.price,
  i.owner_id,
  i.is_public,
  i.visibility,
  i.created_at,
  i.updated_at,
  i.bedrooms,
  i.bathrooms,
  i.type,
  i.purpose,
  i.status,
  i.state,
  i.street,
  i.number,
  i.zipcode,
  i.area_total,
  i.area_built,
  i.suites,
  i.parking,
  i.condo_fee,
  i.iptu,
  i.is_furnished,
  i.vista_mar,
  i.distancia_mar,
  (
    SELECT img.url
    FROM public.imovel_images img
    WHERE img.imovel_id = i.id AND img.is_cover = true
    ORDER BY img.created_at DESC
    LIMIT 1
  ) AS thumb_url
FROM public.imoveis i;