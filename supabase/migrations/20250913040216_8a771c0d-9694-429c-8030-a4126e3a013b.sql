-- Substituir fotos genéricas por fotos reais de imóveis brasileiros
UPDATE properties 
SET fotos = CASE property_type
  WHEN 'casa' THEN ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop&q=80'
  ]
  WHEN 'apartamento' THEN ARRAY[
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687644-aac4c75853c2?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607688960-e095f1930315?w=800&h=600&fit=crop&q=80'
  ]
  WHEN 'comercial' THEN ARRAY[
    'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607688920-4e2a09cf159d?w=800&h=600&fit=crop&q=80'
  ]
  ELSE ARRAY[
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80'
  ]
END
WHERE is_public = true 
AND visibility = 'public_site';