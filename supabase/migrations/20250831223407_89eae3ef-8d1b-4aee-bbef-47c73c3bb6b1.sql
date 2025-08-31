-- FASE FINAL: Adicionar dados de exemplo (corrigido)

-- Inserir planos de exemplo
INSERT INTO conectaios_plans (name, slug, price, property_limit, match_limit, thread_limit, features, is_active) VALUES
('Starter', 'starter', 0, 10, 5, 2, '["Até 10 imóveis", "5 matches por mês", "2 threads simultâneas", "Suporte básico"]'::jsonb, true),
('Professional', 'professional', 97, 50, 25, 10, '["Até 50 imóveis", "25 matches por mês", "10 threads simultâneas", "Suporte prioritário", "Minisite personalizado"]'::jsonb, true),
('Premium', 'premium', 197, 200, 100, 50, '["Até 200 imóveis", "100 matches por mês", "50 threads simultâneas", "Suporte 24/7", "Minisite premium", "Analytics avançados"]'::jsonb, true);

-- Inserir imóveis de exemplo
INSERT INTO conectaios_properties (
  titulo, valor, area, quartos, bathrooms, parking_spots, 
  listing_type, property_type, visibility, descricao, 
  fotos, videos, address, neighborhood, city, state, 
  condominium_fee, iptu, is_public, finalidade
) VALUES
(
  'Apartamento Luxuoso no Jardins', 
  850000, 
  120, 
  3, 
  2, 
  2,
  'venda',
  'apartamento',
  'public_site',
  'Apartamento com acabamento de alto padrão, localizado em uma das regiões mais nobres de São Paulo. Possui sala ampla integrada, cozinha gourmet, suíte master com closet e varanda com vista panorâmica.',
  ARRAY[
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop'
  ],
  ARRAY[]::text[],
  'Rua Augusta, 2500',
  'Jardins',
  'São Paulo',
  'SP',
  800,
  1200,
  true,
  'residencial'
),
(
  'Casa Moderna em Condomínio Fechado',
  1200000,
  300,
  4,
  3,
  4,
  'venda',
  'casa',
  'public_site',
  'Casa contemporânea em condomínio fechado com segurança 24h. Arquitetura moderna, piscina, churrasqueira, jardim paisagístico e ampla área de lazer. Ideal para famílias que buscam conforto e segurança.',
  ARRAY[
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
  ],
  ARRAY[]::text[],
  'Alameda das Acácias, 100',
  'Alphaville',
  'Barueri',
  'SP',
  1500,
  2800,
  true,
  'residencial'
),
(
  'Apartamento Compacto no Centro',
  280000,
  45,
  1,
  1,
  1,
  'venda',
  'apartamento',
  'public_site',
  'Apartamento compacto e funcional no centro da cidade. Otimizado para quem busca praticidade e localização privilegiada. Próximo ao metrô e principais centros comerciais.',
  ARRAY[
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800&h=600&fit=crop'
  ],
  ARRAY[]::text[],
  'Rua XV de Novembro, 450',
  'Centro',
  'São Paulo',
  'SP',
  450,
  300,
  true,
  'residencial'
),
(
  'Cobertura com Vista Panorâmica',
  2500000,
  250,
  4,
  4,
  3,
  'venda',
  'apartamento',
  'public_site',
  'Cobertura duplex com vista 360° da cidade. Terraço com piscina privativa, churrasqueira gourmet e jardim suspenso. Acabamentos importados e automação residencial completa.',
  ARRAY[
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600563438938-a42d4e0a8b5f?w=800&h=600&fit=crop'
  ],
  ARRAY[]::text[],
  'Avenida Paulista, 3000',
  'Bela Vista',
  'São Paulo',
  'SP',
  2500,
  4000,
  true,
  'residencial'
),
(
  'Loft Industrial para Locação',
  4500,
  80,
  1,
  1,
  1,
  'locacao',
  'loft',
  'public_site',
  'Loft com estilo industrial no bairro criativo da Vila Madalena. Pé direito alto, estrutura aparente, perfeito para profissionais criativos ou jovens casais modernos.',
  ARRAY[
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&h=600&fit=crop'
  ],
  ARRAY[]::text[],
  'Rua Harmonia, 200',
  'Vila Madalena',
  'São Paulo',
  'SP',
  300,
  150,
  true,
  'residencial'
),
(
  'Casa de Praia em Bertioga',
  890000,
  180,
  3,
  2,
  2,
  'venda',
  'casa',
  'public_site',
  'Casa de praia a 200m do mar. Arquitetura rústica moderna, churrasqueira, piscina e amplo deck de madeira. Ideal para fins de semana e temporadas.',
  ARRAY[
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
  ],
  ARRAY[]::text[],
  'Rua da Praia, 150',
  'Centro',
  'Bertioga',
  'SP',
  0,
  800,
  true,
  'temporada'
);