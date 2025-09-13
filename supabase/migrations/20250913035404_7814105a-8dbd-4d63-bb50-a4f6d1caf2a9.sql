-- Popular propriedades sem fotos com placeholders apropriados
UPDATE properties 
SET fotos = CASE property_type
  WHEN 'casa' THEN ARRAY[
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800&h=600&fit=crop&q=80'
  ]
  WHEN 'apartamento' THEN ARRAY[
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80'
  ]
  WHEN 'comercial' THEN ARRAY[
    'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&q=80'
  ]
  ELSE ARRAY[
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80'
  ]
END
WHERE is_public = true 
AND visibility = 'public_site' 
AND (fotos IS NULL OR fotos = '{}' OR array_length(fotos, 1) IS NULL);