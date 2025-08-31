-- Add missing columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public_site' CHECK (visibility IN ('hidden', 'match_only', 'public_site')),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zipcode TEXT,
ADD COLUMN IF NOT EXISTS price_per_m2 DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS condominium_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS iptu DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coordinates JSONB;

-- Update existing properties with default visibility
UPDATE public.properties 
SET visibility = 'public_site'
WHERE visibility IS NULL;