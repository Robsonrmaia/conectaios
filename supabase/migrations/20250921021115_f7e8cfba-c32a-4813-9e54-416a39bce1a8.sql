-- Fix imported property data by updating bathrooms and parking_spots from raw data
UPDATE properties 
SET 
  bathrooms = COALESCE(
    CASE 
      WHEN raw_cnm IS NOT NULL AND raw_cnm->>'banheiros' IS NOT NULL 
      THEN (raw_cnm->>'banheiros')::integer
      WHEN raw_vrsync IS NOT NULL AND raw_vrsync->>'banheiros' IS NOT NULL 
      THEN (raw_vrsync->>'banheiros')::integer
      ELSE bathrooms
    END, 
    0
  ),
  parking_spots = COALESCE(
    CASE 
      WHEN raw_cnm IS NOT NULL AND raw_cnm->>'vagas' IS NOT NULL 
      THEN (raw_cnm->>'vagas')::integer
      WHEN raw_vrsync IS NOT NULL AND raw_vrsync->>'vagas' IS NOT NULL 
      THEN (raw_vrsync->>'vagas')::integer
      ELSE parking_spots
    END, 
    0
  )
WHERE (raw_cnm IS NOT NULL OR raw_vrsync IS NOT NULL)
  AND (bathrooms = 0 OR parking_spots = 0);