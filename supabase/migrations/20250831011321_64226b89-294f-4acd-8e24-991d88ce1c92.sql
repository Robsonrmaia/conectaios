-- Add visibility and broker minisite fields to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS broker_minisite_enabled BOOLEAN DEFAULT false;

-- Create index for public properties for better performance
CREATE INDEX IF NOT EXISTS idx_properties_public ON public.properties(is_public) WHERE is_public = true;

-- Update RLS policy to allow viewing public properties
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;
CREATE POLICY "Public properties are viewable by everyone" 
ON public.properties 
FOR SELECT 
USING (is_public = true);

-- Keep existing policy for users managing their own properties
-- Users can still manage all their own properties regardless of visibility