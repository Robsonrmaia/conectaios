-- Add sample banners
INSERT INTO public.banners (title, image_url, link_url, is_active, sort_order) VALUES
('Apartamento Luxury Vista Mar', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://example.com/apartamento-luxury', true, 1),
('Casa Colonial Centro Histórico', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://example.com/casa-colonial', true, 2),
('Condomínio Residencial Ilhéus', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://example.com/condominio-ilheus', true, 3);

-- Add sample partnerships
INSERT INTO public.partnerships (name, logo_url, website_url, is_active) VALUES
('Caixa Econômica Federal', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', 'https://caixa.gov.br', true),
('Banco do Brasil', 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', 'https://bb.com.br', true),
('Santander', 'https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', 'https://santander.com.br', true),
('Bradesco', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', 'https://bradesco.com.br', true),
('Creci-BA', null, 'https://creci-ba.gov.br', true),
('Prefeitura de Ilhéus', null, 'https://ilheus.ba.gov.br', true);