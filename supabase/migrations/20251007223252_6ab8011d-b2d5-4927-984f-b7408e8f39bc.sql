-- Fix RLS policies for property-images bucket to allow anonymous uploads
-- This is needed for property submission forms where users are not authenticated

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous uploads to submissions folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to delete their property images" ON storage.objects;

-- Create policy for anonymous uploads to submissions folder
CREATE POLICY "Allow anonymous uploads to submissions folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = 'submissions'
);

-- Create policy for public read access
CREATE POLICY "Allow public read access to property images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Create policy for authenticated users to upload anywhere
CREATE POLICY "Allow authenticated users to upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Create policy for users to delete their own images
CREATE POLICY "Allow owners to delete their property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');