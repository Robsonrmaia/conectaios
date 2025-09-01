-- Add unique constraint to conectaios_profiles if it doesn't exist
ALTER TABLE conectaios_profiles ADD CONSTRAINT conectaios_profiles_user_id_unique UNIQUE (user_id);

-- Insert example profiles (using INSERT ... ON CONFLICT DO NOTHING since we might have existing data)
INSERT INTO conectaios_profiles (user_id, nome) VALUES 
  ('cafb3b1d-7008-41b9-827f-c9d617f072ce', 'João Silva'),
  ('be4583f1-3041-4e1c-be17-23264fb58929', 'Maria Santos'),
  ('5f89f4ba-60c7-4a7e-b35f-df41f6e09d4c', 'Pedro Oliveira'),
  ('5fa89856-831a-4223-91fb-21680d563a2c', 'Ana Costa'),
  ('845df413-6fc0-42a5-b044-e129c472a7c6', 'Carlos Mendes')
ON CONFLICT (user_id) DO NOTHING;

-- Update properties to have the created user_ids and better data
UPDATE conectaios_properties SET 
  user_id = 'cafb3b1d-7008-41b9-827f-c9d617f072ce',
  address = 'Rua das Flores, 123',
  neighborhood = 'Centro',
  city = 'Ilhéus',
  state = 'BA',
  descricao = 'Apartamento moderno e bem localizado no coração da cidade',
  fotos = ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500']
WHERE titulo = 'Apartamento Luxuoso no Centro';

UPDATE conectaios_properties SET 
  user_id = 'be4583f1-3041-4e1c-be17-23264fb58929',
  address = 'Av. Soares Lopes, 456',
  neighborhood = 'Conquista',
  city = 'Ilhéus',
  state = 'BA',
  descricao = 'Casa espaçosa com piscina e área gourmet, perfeita para família',
  fotos = ARRAY['https://images.unsplash.com/photo-1505843795480-5cfb3c03f6ff?w=500', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500']
WHERE titulo = 'Casa Moderna com Piscina';

UPDATE conectaios_properties SET 
  user_id = '5f89f4ba-60c7-4a7e-b35f-df41f6e09d4c',
  address = 'Rua Beira Mar, 789',
  neighborhood = 'Pontal',
  city = 'Ilhéus',
  state = 'BA',
  descricao = 'Cobertura duplex com vista panorâmica do mar, acabamento de luxo',
  fotos = ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500']
WHERE titulo = 'Cobertura Duplex Vista Mar';

UPDATE conectaios_properties SET 
  user_id = '5fa89856-831a-4223-91fb-21680d563a2c',
  address = 'Rua Eustáquio Bastos, 321',
  neighborhood = 'Malhado',
  city = 'Ilhéus',
  state = 'BA',
  descricao = 'Apartamento compacto e funcional, ideal para investimento',
  fotos = ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500']
WHERE titulo = 'Apartamento Compacto Mobiliado';

UPDATE conectaios_properties SET 
  user_id = '845df413-6fc0-42a5-b044-e129c472a7c6',
  address = 'Rua Jorge Amado, 654',
  neighborhood = 'Zona Sul',
  city = 'Ilhéus',
  state = 'BA',
  descricao = 'Sobrado familiar com amplos espaços e quintal grande',
  fotos = ARRAY['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500', 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=500']
WHERE titulo = 'Sobrado Familiar Zona Sul';