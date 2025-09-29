-- ============================================
-- FIX: Configurar bucket 'imoveis' como público
-- ============================================

-- Atualizar bucket para público (permite URLs públicas)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'imoveis';

-- Garantir políticas de Storage já existem (idempotente)
DO $$
BEGIN
  -- SELECT (leitura pública do bucket imoveis)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND policyname='Read imoveis public'
  ) THEN
    CREATE POLICY "Read imoveis public"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'imoveis');
  END IF;

  -- INSERT (upload somente do dono na pasta uid/)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND policyname='Upload to imoveis by owner'
  ) THEN
    CREATE POLICY "Upload to imoveis by owner"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'imoveis'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- UPDATE (somente dono)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND policyname='Edit imoveis by owner'
  ) THEN
    CREATE POLICY "Edit imoveis by owner"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id='imoveis' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id='imoveis' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- DELETE (somente dono)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND policyname='Delete imoveis by owner'
  ) THEN
    CREATE POLICY "Delete imoveis by owner"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id='imoveis' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;