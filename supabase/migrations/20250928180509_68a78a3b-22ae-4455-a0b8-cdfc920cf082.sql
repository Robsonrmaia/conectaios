-- Create storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'imoveis', 'imoveis', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'imoveis'
);

-- Create storage policies for property images
DO $$
BEGIN
  -- Allow authenticated users to upload images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can upload property images'
  ) THEN
    CREATE POLICY "Users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'imoveis' AND auth.uid() IS NOT NULL
    );
  END IF;

  -- Allow public read access to images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Property images are publicly readable'
  ) THEN
    CREATE POLICY "Property images are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'imoveis');
  END IF;

  -- Allow users to update their own property images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can update their property images'
  ) THEN
    CREATE POLICY "Users can update their property images" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'imoveis' AND auth.uid() IS NOT NULL
    );
  END IF;

  -- Allow users to delete their own property images  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can delete their property images'
  ) THEN
    CREATE POLICY "Users can delete their property images" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'imoveis' AND auth.uid() IS NOT NULL
    );
  END IF;
END $$;