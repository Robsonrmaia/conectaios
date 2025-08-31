-- Fix properties table migration by removing dependent policies first
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Users can manage their own properties" ON public.properties;

-- Now safely drop the old columns
ALTER TABLE public.properties 
DROP COLUMN IF EXISTS finalidade,
DROP COLUMN IF EXISTS is_public,
DROP COLUMN IF EXISTS broker_minisite_enabled;

-- Add new columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zipcode TEXT,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parking_spots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartamento',
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'venda' CHECK (listing_type IN ('venda', 'locacao')),
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public_site' CHECK (visibility IN ('hidden', 'match_only', 'public_site')),
ADD COLUMN IF NOT EXISTS price_per_m2 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS condominium_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS iptu DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coordinates JSONB;

-- Recreate properties policies with new columns
CREATE POLICY "Public properties are viewable by everyone" ON public.properties 
FOR SELECT USING (visibility = 'public_site');

CREATE POLICY "Users can manage their own properties" ON public.properties 
FOR ALL USING (auth.uid() = user_id);