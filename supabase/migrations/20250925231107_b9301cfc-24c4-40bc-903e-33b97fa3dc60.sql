-- Create RLS policy for public submissions uploads to property-images bucket

-- Create policy to allow public uploads to submissions folder in property-images bucket
CREATE POLICY "Allow public uploads to submissions folder" 
ON storage.objects 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = 'submissions'
  AND auth.role() IN ('anon', 'authenticated')
);

-- Create policy to allow public access to view submissions images
CREATE POLICY "Allow public access to submissions images" 
ON storage.objects 
FOR SELECT 
TO anon, authenticated
USING (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = 'submissions'
);

-- Create policy to allow updates to submissions folder (for potential overwrites)
CREATE POLICY "Allow public updates to submissions folder" 
ON storage.objects 
FOR UPDATE 
TO anon, authenticated
USING (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = 'submissions'
)
WITH CHECK (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = 'submissions'
);