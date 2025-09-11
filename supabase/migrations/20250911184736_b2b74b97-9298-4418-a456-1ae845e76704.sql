-- Add test property data for testing the search functionality
INSERT INTO properties (
  user_id, 
  titulo, 
  property_type, 
  listing_type, 
  valor, 
  quartos, 
  area, 
  city, 
  state, 
  neighborhood, 
  address, 
  descricao, 
  is_public, 
  visibility
) VALUES 
-- Commercial properties
(
  (SELECT user_id FROM conectaios_brokers LIMIT 1),
  'Sala Comercial Centro',
  'comercial',
  'venda',
  250000,
  0,
  80,
  'São Paulo',
  'SP',
  'Centro',
  'Rua XV de Novembro, 123',
  'Excelente sala comercial no centro da cidade, com ótima localização.',
  true,
  'public_site'
),
(
  (SELECT user_id FROM conectaios_brokers LIMIT 1),
  'Loja Térrea Vila Olímpia',
  'comercial',
  'aluguel',
  8500,
  0,
  120,
  'São Paulo',
  'SP',
  'Vila Olímpia',
  'Av. Faria Lima, 456',
  'Loja térrea com grande vitrine e fluxo intenso de pessoas.',
  true,
  'public_site'
),
-- Residential properties
(
  (SELECT user_id FROM conectaios_brokers LIMIT 1),
  'Apartamento Moderno Jardins',
  'apartamento',
  'venda',
  850000,
  3,
  95,
  'São Paulo',
  'SP',
  'Jardins',
  'Rua Augusta, 789',
  'Apartamento de 3 quartos com vista privilegiada.',
  true,
  'public_site'
),
(
  (SELECT user_id FROM conectaios_brokers LIMIT 1),
  'Casa Sobrado Vila Madalena',
  'casa',
  'venda',
  1200000,
  4,
  180,
  'São Paulo',
  'SP',
  'Vila Madalena',
  'Rua Harmonia, 321',
  'Casa sobrado com 4 quartos e quintal.',
  true,
  'public_site'
),
(
  (SELECT user_id FROM conectaios_brokers LIMIT 1),
  'Apartamento Compacto Liberdade',
  'apartamento',
  'aluguel',
  2800,
  2,
  65,
  'São Paulo',
  'SP',
  'Liberdade',
  'Rua da Glória, 654',
  'Apartamento de 2 quartos, ideal para casal.',
  true,
  'public_site'
);

-- Update the intelligent matching function to be less restrictive
CREATE OR REPLACE FUNCTION public.find_intelligent_property_matches(search_id uuid)
RETURNS TABLE(property_id uuid, match_score integer, match_reasons text[], property_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  search_criteria client_searches%ROWTYPE;
BEGIN
  -- Get search criteria
  SELECT * INTO search_criteria FROM client_searches WHERE id = search_id;
  
  IF search_criteria.id IS NULL THEN
    RAISE EXCEPTION 'Search not found';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as property_id,
    CASE 
      -- Perfect matches get high scores
      WHEN p.property_type = search_criteria.property_type 
           AND p.listing_type = search_criteria.listing_type
           AND p.valor BETWEEN COALESCE(search_criteria.min_price, 0) AND search_criteria.max_price
           AND p.quartos BETWEEN COALESCE(search_criteria.min_bedrooms, 0) AND COALESCE(search_criteria.max_bedrooms, 10)
           AND (search_criteria.city IS NULL OR p.city ILIKE '%' || search_criteria.city || '%')
           AND (search_criteria.neighborhood IS NULL OR p.neighborhood ILIKE '%' || search_criteria.neighborhood || '%')
           THEN 95
      
      -- Good matches - same type and listing, flexible price
      WHEN p.property_type = search_criteria.property_type 
           AND p.listing_type = search_criteria.listing_type
           AND p.valor <= search_criteria.max_price * 1.2 -- 20% tolerance
           AND (p.quartos >= COALESCE(search_criteria.min_bedrooms, 0) OR search_criteria.min_bedrooms IS NULL)
           THEN 80
      
      -- Acceptable matches - same listing type, flexible property type
      WHEN p.listing_type = search_criteria.listing_type
           AND p.valor <= search_criteria.max_price * 1.5 -- 50% tolerance
           THEN 65
      
      -- Broader matches - similar price range
      WHEN p.valor BETWEEN COALESCE(search_criteria.min_price, 0) * 0.8 AND search_criteria.max_price * 1.5
           THEN 50
      
      ELSE 30
    END as match_score,
    
    -- Build match reasons array with more detailed explanations
    ARRAY_REMOVE(ARRAY[
      CASE WHEN p.property_type = search_criteria.property_type THEN 'Tipo de imóvel compatível (' || p.property_type || ')' END,
      CASE WHEN p.listing_type = search_criteria.listing_type THEN 'Finalidade compatível (' || p.listing_type || ')' END,
      CASE WHEN p.valor <= search_criteria.max_price THEN 'Preço dentro do orçamento (R$ ' || ROUND(p.valor) || ')' END,
      CASE WHEN p.valor > search_criteria.max_price AND p.valor <= search_criteria.max_price * 1.2 THEN 'Preço ligeiramente acima (R$ ' || ROUND(p.valor) || ')' END,
      CASE WHEN p.quartos >= COALESCE(search_criteria.min_bedrooms, 0) AND search_criteria.min_bedrooms IS NOT NULL THEN 'Quartos suficientes (' || p.quartos || ')' END,
      CASE WHEN search_criteria.city IS NULL OR p.city ILIKE '%' || search_criteria.city || '%' THEN 'Cidade compatível (' || COALESCE(p.city, 'N/I') || ')' END,
      CASE WHEN search_criteria.neighborhood IS NULL OR p.neighborhood ILIKE '%' || search_criteria.neighborhood || '%' THEN 'Bairro compatível (' || COALESCE(p.neighborhood, 'N/I') || ')' END,
      CASE WHEN p.area >= COALESCE(search_criteria.min_area, 0) AND search_criteria.min_area IS NOT NULL THEN 'Área adequada (' || p.area || 'm²)' END
    ], NULL)::TEXT[] as match_reasons,
    
    row_to_json(p)::JSONB as property_data
  FROM public.properties p
  WHERE p.is_public = true 
    AND p.visibility = 'public_site'
    AND p.user_id != search_criteria.user_id -- Don't match own properties
    AND (
      -- More flexible matching criteria
      (p.listing_type = search_criteria.listing_type) OR
      (p.valor <= search_criteria.max_price * 1.5) OR
      (p.property_type = search_criteria.property_type)
    )
  ORDER BY match_score DESC, p.created_at DESC
  LIMIT 30;
END;
$function$;