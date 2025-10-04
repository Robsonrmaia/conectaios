-- Corrigir títulos e campos dos imóveis de inglês para português
-- Atualização dos dados existentes importados com termos em inglês

-- 1. Remover constraint antigo que aceita apenas valores em inglês
ALTER TABLE imoveis DROP CONSTRAINT IF EXISTS imoveis_purpose_check;

-- 2. Atualizar campo purpose primeiro (sem constraint)
UPDATE imoveis 
SET purpose = CASE purpose
  WHEN 'sale' THEN 'venda'
  WHEN 'rent' THEN 'locacao'
  WHEN 'season' THEN 'temporada'
  ELSE purpose
END
WHERE purpose IN ('sale', 'rent', 'season');

-- 3. Criar novo constraint com valores em português
ALTER TABLE imoveis 
ADD CONSTRAINT imoveis_purpose_check 
CHECK (purpose IN ('venda', 'locacao', 'temporada'));

-- 4. Atualizar campo property_type
UPDATE imoveis 
SET property_type = CASE property_type
  WHEN 'apartment' THEN 'apartamento'
  WHEN 'house' THEN 'casa'
  WHEN 'land' THEN 'terreno'
  WHEN 'room' THEN 'quarto'
  WHEN 'commercial' THEN 'comercial'
  ELSE property_type
END
WHERE property_type IN ('apartment', 'house', 'land', 'room', 'commercial');

-- 5. Atualizar campo listing_type
UPDATE imoveis 
SET listing_type = CASE listing_type
  WHEN 'sale' THEN 'venda'
  WHEN 'rent' THEN 'locacao'
  WHEN 'season' THEN 'temporada'
  ELSE listing_type
END
WHERE listing_type IN ('sale', 'rent', 'season');

-- 6. Atualizar títulos que contêm termos em inglês
UPDATE imoveis 
SET title = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(title, 
              'apartment ', 'Apartamento '),
            'house ', 'Casa '),
          'land ', 'Terreno '),
        'room ', 'Quarto '),
      'sale ', 'venda '),
    'rent ', 'locação '
  )
WHERE 
  title ILIKE '%apartment %' OR 
  title ILIKE '%house %' OR 
  title ILIKE '%land %' OR 
  title ILIKE '%room %' OR
  title ILIKE '%sale %' OR
  title ILIKE '%rent %';

-- 7. Atualizar descrições que possam conter termos em inglês
UPDATE imoveis 
SET description = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(description,
              'For sale', 'Para venda'),
            'For rent', 'Para locação'),
          'apartment', 'apartamento'),
        'house', 'casa'),
      'land', 'terreno'),
    'commercial', 'comercial'
  )
WHERE description IS NOT NULL 
  AND (
    description ILIKE '%for sale%' OR 
    description ILIKE '%for rent%' OR
    description ILIKE '%apartment%' OR
    description ILIKE '%house%' OR
    description ILIKE '%land%' OR
    description ILIKE '%commercial%'
  );