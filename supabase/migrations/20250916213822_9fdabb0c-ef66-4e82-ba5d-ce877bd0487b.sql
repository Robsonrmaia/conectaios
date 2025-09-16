-- Upload logo to storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public access to property images
CREATE POLICY "Allow public access to property images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');

-- Create policy for authenticated users to upload property images
CREATE POLICY "Allow authenticated users to upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');