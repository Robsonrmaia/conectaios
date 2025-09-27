-- Criar tabelas faltantes para gamificação e configurações

-- Tabela para qualidade dos imóveis
CREATE TABLE IF NOT EXISTS public.imoveis_quality (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    imovel_id UUID NOT NULL,
    corretor_id UUID NOT NULL,
    percentual NUMERIC NOT NULL DEFAULT 0,
    tem_8_fotos BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(imovel_id)
);

-- Tabela para regras de pontos de gamificação
CREATE TABLE IF NOT EXISTS public.gam_points_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    pontos INTEGER NOT NULL DEFAULT 0,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para badges de gamificação
CREATE TABLE IF NOT EXISTS public.gam_badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    descricao TEXT,
    icone TEXT,
    cor TEXT DEFAULT '#3B82F6',
    prioridade INTEGER DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para estatísticas mensais dos usuários
CREATE TABLE IF NOT EXISTS public.gam_user_monthly (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    pontos INTEGER NOT NULL DEFAULT 0,
    tier TEXT DEFAULT 'Sem Desconto',
    desconto_percent INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(usuario_id, ano, mes)
);

-- Tabela para eventos de gamificação
CREATE TABLE IF NOT EXISTS public.gam_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL,
    rule_key TEXT NOT NULL,
    pontos INTEGER NOT NULL DEFAULT 0,
    ref_tipo TEXT,
    ref_id TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações de minisites
CREATE TABLE IF NOT EXISTS public.minisite_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT DEFAULT 'Meu Minisite',
    primary_color TEXT DEFAULT '#3B82F6',
    secondary_color TEXT DEFAULT '#EF4444',
    template_id TEXT DEFAULT 'default',
    show_properties BOOLEAN DEFAULT true,
    show_contact BOOLEAN DEFAULT true,
    show_about BOOLEAN DEFAULT true,
    custom_domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.imoveis_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gam_points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gam_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gam_user_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minisite_configs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para imoveis_quality
CREATE POLICY "imoveis_quality_owner_access" ON public.imoveis_quality
    FOR ALL USING (corretor_id = auth.uid());

-- Políticas RLS para gam_points_rules (público para leitura)
CREATE POLICY "gam_points_rules_public_read" ON public.gam_points_rules
    FOR SELECT USING (true);

-- Políticas RLS para gam_badges (público para leitura)
CREATE POLICY "gam_badges_public_read" ON public.gam_badges
    FOR SELECT USING (true);

-- Políticas RLS para gam_user_monthly
CREATE POLICY "gam_user_monthly_owner_access" ON public.gam_user_monthly
    FOR ALL USING (usuario_id = auth.uid());

-- Políticas RLS para gam_events
CREATE POLICY "gam_events_owner_access" ON public.gam_events
    FOR ALL USING (usuario_id = auth.uid());

-- Políticas RLS para system_settings (público para leitura)
CREATE POLICY "system_settings_public_read" ON public.system_settings
    FOR SELECT USING (true);

-- Políticas RLS para minisite_configs
CREATE POLICY "minisite_configs_owner_access" ON public.minisite_configs
    FOR ALL USING (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_imoveis_quality_updated_at
    BEFORE UPDATE ON public.imoveis_quality
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gam_user_monthly_updated_at
    BEFORE UPDATE ON public.gam_user_monthly
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_minisite_configs_updated_at
    BEFORE UPDATE ON public.minisite_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais para regras de pontos
INSERT INTO public.gam_points_rules (key, label, pontos, descricao) VALUES
('imovel_qualidade', 'Imóvel com Qualidade Alta', 15, 'Pontos por imóvel com qualidade >= 90%'),
('imovel_8_fotos', 'Imóvel com 8+ Fotos', 2, 'Pontos por imóvel com 8 ou mais fotos'),
('imovel_vendido', 'Imóvel Vendido/Alugado', 50, 'Pontos por imóvel vendido ou alugado'),
('match_1h', 'Resposta em 1 Hora', 10, 'Resposta rápida a match em até 1 hora'),
('match_12h', 'Resposta em 12 Horas', 5, 'Resposta a match em até 12 horas'),
('match_24h', 'Resposta em 24 Horas', 2, 'Resposta a match em até 24 horas'),
('avaliacao_5', 'Avaliação 5 Estrelas', 10, 'Recebeu avaliação 5 estrelas'),
('avaliacao_4', 'Avaliação 4 Estrelas', 5, 'Recebeu avaliação 4 estrelas'),
('compartilhamento_social', 'Compartilhamento Social', 3, 'Compartilhou conteúdo nas redes sociais'),
('interacao_social', 'Interação Social', 1, 'Curtida ou comentário em rede social')
ON CONFLICT (key) DO NOTHING;

-- Inserir badges iniciais
INSERT INTO public.gam_badges (slug, label, descricao, icone, cor) VALUES
('bronze', 'Bronze', 'Primeiro nível de corretor', 'medal', '#CD7F32'),
('prata', 'Prata', 'Corretor intermediário', 'medal', '#C0C0C0'),
('ouro', 'Ouro', 'Corretor experiente', 'medal', '#FFD700'),
('diamante', 'Diamante', 'Corretor elite', 'gem', '#B9F2FF'),
('vendedor_mes', 'Vendedor do Mês', 'Melhor vendedor do mês', 'trophy', '#FF6B6B')
ON CONFLICT (slug) DO NOTHING;

-- Inserir configurações do sistema iniciais
INSERT INTO public.system_settings (key, value) VALUES
('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção", "estimated_time": ""}'),
('construction_mode', '{"enabled": false, "message": "Site em construção", "estimated_time": ""}')
ON CONFLICT (key) DO NOTHING;

-- Função para aplicar pontos (para gamificação)
CREATE OR REPLACE FUNCTION public.apply_points(
    p_usuario_id UUID,
    p_rule_key TEXT,
    p_pontos INTEGER,
    p_ref_tipo TEXT DEFAULT NULL,
    p_ref_id TEXT DEFAULT NULL,
    p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
    current_month INTEGER := EXTRACT(MONTH FROM NOW());
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
    -- Inserir evento
    INSERT INTO public.gam_events (usuario_id, rule_key, pontos, ref_tipo, ref_id, meta)
    VALUES (p_usuario_id, p_rule_key, p_pontos, p_ref_tipo, p_ref_id, p_meta);
    
    -- Atualizar ou criar estatísticas mensais
    INSERT INTO public.gam_user_monthly (usuario_id, ano, mes, pontos)
    VALUES (p_usuario_id, current_year, current_month, p_pontos)
    ON CONFLICT (usuario_id, ano, mes)
    DO UPDATE SET 
        pontos = gam_user_monthly.pontos + p_pontos,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;