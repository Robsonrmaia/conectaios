-- First, ensure admin user exists and promote current session user to admin
DO $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current authenticated user
    current_user_id := auth.uid();
    
    -- If user exists, ensure they have admin role
    IF current_user_id IS NOT NULL THEN
        -- Create or update profile with admin role
        INSERT INTO profiles (user_id, nome, role)
        VALUES (current_user_id, 'Admin User', 'admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    END IF;
END $$;

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    testimonial TEXT NOT NULL,
    photo_url TEXT,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partners table  
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    description TEXT,
    category TEXT DEFAULT 'parceiro',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create policies for testimonials
CREATE POLICY "Public can view active testimonials" ON public.testimonials
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage testimonials" ON public.testimonials
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Create policies for partners
CREATE POLICY "Public can view active partners" ON public.partners
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage partners" ON public.partners
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Insert some sample data
INSERT INTO testimonials (name, company, role, testimonial, rating) VALUES
('Maria Silva', 'Imobiliária Central', 'Corretora', 'A ConectaIOS revolucionou minha forma de trabalhar. Aumento de 40% nas vendas!', 5),
('João Santos', 'Grupo Habitacional', 'Diretor', 'Plataforma intuitiva e resultados excepcionais. Recomendo para todos os corretores.', 5),
('Ana Costa', 'Prime Properties', 'Gerente', 'Ferramentas incríveis que me ajudaram a fechar mais negócios este ano.', 5)
ON CONFLICT DO NOTHING;

INSERT INTO partners (name, logo_url, category, description) VALUES
('Banco do Brasil', '/logos/bb.png', 'banco', 'Financiamentos e crédito imobiliário'),
('Caixa Econômica', '/logos/caixa.png', 'banco', 'Maior banco público do país'),
('Bradesco', '/logos/bradesco.png', 'banco', 'Soluções financeiras completas'),
('Itaú', '/logos/itau.png', 'banco', 'Banco líder em tecnologia'),
('Santander', '/logos/santander.png', 'banco', 'Banco internacional')
ON CONFLICT DO NOTHING;