-- ============================================
-- RLS POLICIES FOR IMOVEIS TABLE
-- ============================================

-- Enable RLS on imoveis table (if not already enabled)
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - users can see public properties or their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imoveis' AND policyname='imoveis_select_visible_or_own'
  ) THEN
    CREATE POLICY imoveis_select_visible_or_own
      ON public.imoveis
      FOR SELECT
      USING (is_public = true OR owner_id = auth.uid());
  END IF;
END $$;

-- Policy: INSERT - authenticated users can insert their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imoveis' AND policyname='imoveis_insert_own'
  ) THEN
    CREATE POLICY imoveis_insert_own
      ON public.imoveis
      FOR INSERT TO authenticated
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- Policy: UPDATE - users can update their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imoveis' AND policyname='imoveis_update_own'
  ) THEN
    CREATE POLICY imoveis_update_own
      ON public.imoveis
      FOR UPDATE TO authenticated
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- Policy: DELETE - users can delete their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imoveis' AND policyname='imoveis_delete_own'
  ) THEN
    CREATE POLICY imoveis_delete_own
      ON public.imoveis
      FOR DELETE TO authenticated
      USING (owner_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- RLS POLICIES FOR IMOVEL_IMAGES TABLE
-- ============================================

-- Enable RLS on imovel_images table
ALTER TABLE public.imovel_images ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - users can see images from public properties or their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imovel_images' AND policyname='imovel_images_select_public_or_owner'
  ) THEN
    CREATE POLICY imovel_images_select_public_or_owner
      ON public.imovel_images
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id
            AND (i.is_public = true OR i.owner_id = auth.uid())
        )
      );
  END IF;
END $$;

-- Policy: INSERT - users can insert images for their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imovel_images' AND policyname='imovel_images_insert_owner'
  ) THEN
    CREATE POLICY imovel_images_insert_owner
      ON public.imovel_images
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id
            AND i.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: UPDATE - users can update images from their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imovel_images' AND policyname='imovel_images_update_owner'
  ) THEN
    CREATE POLICY imovel_images_update_owner
      ON public.imovel_images
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id
            AND i.owner_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id
            AND i.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: DELETE - users can delete images from their own properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='imovel_images' AND policyname='imovel_images_delete_owner'
  ) THEN
    CREATE POLICY imovel_images_delete_owner
      ON public.imovel_images
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.imoveis i
          WHERE i.id = imovel_images.imovel_id
            AND i.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- STORAGE POLICIES FOR IMOVEIS BUCKET
-- ============================================

-- Policy: SELECT (read) - public access to read all images in imoveis bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Read imoveis public'
  ) THEN
    CREATE POLICY "Read imoveis public"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'imoveis');
  END IF;
END $$;

-- Policy: INSERT (upload) - authenticated users can upload to their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Upload to imoveis by owner'
  ) THEN
    CREATE POLICY "Upload to imoveis by owner"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'imoveis'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Policy: UPDATE - authenticated users can update files in their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Edit imoveis by owner'
  ) THEN
    CREATE POLICY "Edit imoveis by owner"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'imoveis' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'imoveis' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Policy: DELETE - authenticated users can delete files in their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Delete imoveis by owner'
  ) THEN
    CREATE POLICY "Delete imoveis by owner"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'imoveis' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;