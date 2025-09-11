-- Add test property data using the correct UUID function
DO $$
DECLARE
    broker_user_id UUID;
BEGIN
    -- Get the first available broker user_id
    SELECT user_id INTO broker_user_id 
    FROM conectaios_brokers 
    LIMIT 1;
    
    -- Only insert if we found a broker and the properties don't already exist
    IF broker_user_id IS NOT NULL THEN
        -- Insert only if these specific properties don't exist
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
          visibility,
          reference_code
        ) 
        SELECT 
          broker_user_id,
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
          visibility,
          'TEST' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6)
        FROM (VALUES 
          ('Sala Comercial Centro Teste', 'comercial', 'venda', 250000, 0, 80, 'São Paulo', 'SP', 'Centro', 'Rua XV de Novembro, 123', 'Excelente sala comercial no centro da cidade', true, 'public_site'),
          ('Loja Vila Olímpia Teste', 'comercial', 'aluguel', 8500, 0, 120, 'São Paulo', 'SP', 'Vila Olímpia', 'Av. Faria Lima, 456', 'Loja térrea com grande vitrine', true, 'public_site'),
          ('Apartamento Jardins Teste', 'apartamento', 'venda', 850000, 3, 95, 'São Paulo', 'SP', 'Jardins', 'Rua Augusta, 789', 'Apartamento de 3 quartos com vista', true, 'public_site'),
          ('Casa Vila Madalena Teste', 'casa', 'venda', 1200000, 4, 180, 'São Paulo', 'SP', 'Vila Madalena', 'Rua Harmonia, 321', 'Casa sobrado com quintal', true, 'public_site'),
          ('Apartamento Liberdade Teste', 'apartamento', 'aluguel', 2800, 2, 65, 'São Paulo', 'SP', 'Liberdade', 'Rua da Glória, 654', 'Apartamento compacto para casal', true, 'public_site')
        ) AS new_props(titulo, property_type, listing_type, valor, quartos, area, city, state, neighborhood, address, descricao, is_public, visibility)
        WHERE NOT EXISTS (
          SELECT 1 FROM properties WHERE titulo LIKE '%Teste%' LIMIT 1
        );
        
        RAISE NOTICE 'Test properties inserted successfully';
    ELSE
        RAISE NOTICE 'No brokers found - cannot insert test properties';
    END IF;
END $$;