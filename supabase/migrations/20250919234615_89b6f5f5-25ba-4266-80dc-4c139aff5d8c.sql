-- ============================================================================
-- ConectaIOS Gamification System - Complete Implementation
-- Migration: Create all gamification tables, views, functions and triggers
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. GAMIFICATION CORE TABLES
-- ============================================================================

-- Points rules catalog
CREATE TABLE IF NOT EXISTS gam_points_rules (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  pontos INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User monthly points and status
CREATE TABLE IF NOT EXISTS gam_user_monthly (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES conectaios_brokers(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  pontos INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Sem Desconto',
  desconto_percent INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(usuario_id, ano, mes)
);

-- Historical monthly data (archived)
CREATE TABLE IF NOT EXISTS gam_user_history (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  pontos INTEGER DEFAULT 0,
  tier TEXT,
  desconto_percent INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  fechado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  was_champion BOOLEAN DEFAULT false
);

-- Event log for points (audit trail)
CREATE TABLE IF NOT EXISTS gam_events (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES conectaios_brokers(id) ON DELETE CASCADE,
  rule_key TEXT NOT NULL,
  pontos INTEGER NOT NULL,
  ref_tipo TEXT, -- 'match', 'property', 'review', 'social'
  ref_id UUID,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Badge definitions catalog
CREATE TABLE IF NOT EXISTS gam_badges (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  descricao TEXT,
  condicao_sql TEXT, -- For verification queries
  prioridade INTEGER DEFAULT 0,
  icone TEXT DEFAULT '🏆'
);

-- Visibility boost for search results
CREATE TABLE IF NOT EXISTS gam_visibility_boost (
  usuario_id UUID PRIMARY KEY REFERENCES conectaios_brokers(id) ON DELETE CASCADE,
  boost FLOAT DEFAULT 1.0,
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscription credits (for free months, etc.)
CREATE TABLE IF NOT EXISTS assinaturas_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES conectaios_brokers(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'free_month', 'discount', etc.
  valor NUMERIC DEFAULT 0,
  referencia_ano_mes INTEGER,
  usado BOOLEAN DEFAULT false,
  usado_em TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gam_user_monthly_usuario_id ON gam_user_monthly(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gam_user_monthly_ano_mes ON gam_user_monthly(ano, mes);
CREATE INDEX IF NOT EXISTS idx_gam_events_usuario_id ON gam_events(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gam_events_created_at ON gam_events(created_at);
CREATE INDEX IF NOT EXISTS idx_gam_events_rule_key ON gam_events(rule_key);
CREATE INDEX IF NOT EXISTS idx_gam_user_history_usuario_id ON gam_user_history(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gam_user_history_ano_mes ON gam_user_history(ano, mes);

-- ============================================================================
-- 3. PROPERTY QUALITY CALCULATION
-- ============================================================================

-- Function to calculate property quality percentage
CREATE OR REPLACE FUNCTION calc_imovel_quality(imovel_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prop RECORD;
  quality_score INTEGER := 0;
  foto_count INTEGER := 0;
BEGIN
  -- Get property data
  SELECT * INTO prop FROM properties WHERE id = imovel_id;
  
  IF prop.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Basic fields validation (each worth points towards 100%)
  IF prop.valor > 0 THEN quality_score := quality_score + 15; END IF;
  IF LENGTH(COALESCE(prop.descricao, '')) >= 600 THEN quality_score := quality_score + 20; END IF;
  IF prop.area > 0 THEN quality_score := quality_score + 10; END IF;
  IF prop.quartos >= 1 THEN quality_score := quality_score + 10; END IF;
  IF LENGTH(COALESCE(prop.address, '')) > 10 THEN quality_score := quality_score + 10; END IF;
  IF LENGTH(COALESCE(prop.neighborhood, '')) > 0 THEN quality_score := quality_score + 5; END IF;
  IF LENGTH(COALESCE(prop.city, '')) > 0 THEN quality_score := quality_score + 5; END IF;
  IF prop.coordinates IS NOT NULL THEN quality_score := quality_score + 5; END IF;
  
  -- Photo count check
  foto_count := COALESCE(array_length(prop.fotos, 1), 0);
  IF foto_count >= 8 THEN 
    quality_score := quality_score + 20; 
  ELSIF foto_count >= 5 THEN
    quality_score := quality_score + 10;
  ELSIF foto_count >= 3 THEN
    quality_score := quality_score + 5;
  END IF;
  
  -- Cap at 100%
  IF quality_score > 100 THEN quality_score := 100; END IF;
  
  RETURN quality_score;
END;
$$;

-- View for property quality with calculated metrics
CREATE OR REPLACE VIEW imoveis_quality AS
SELECT 
  p.id as imovel_id,
  p.user_id as corretor_id,
  calc_imovel_quality(p.id) as percentual,
  COALESCE(array_length(p.fotos, 1), 0) >= 8 as tem_8_fotos,
  p.updated_at
FROM properties p
WHERE p.is_public = true;

-- ============================================================================
-- 4. GAMIFICATION LOGIC FUNCTIONS
-- ============================================================================

-- Apply points to user (main function)
CREATE OR REPLACE FUNCTION apply_points(
  p_usuario_id UUID,
  p_rule_key TEXT,
  p_pontos INTEGER,
  p_ref_tipo TEXT DEFAULT NULL,
  p_ref_id UUID DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_ano INTEGER;
  current_mes INTEGER;
  current_pontos INTEGER;
  new_tier TEXT;
  new_desconto INTEGER;
  new_badges TEXT[];
BEGIN
  -- Get current month in America/Bahia timezone
  SELECT 
    EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Bahia')::INTEGER,
    EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Bahia')::INTEGER
  INTO current_ano, current_mes;
  
  -- Insert event log
  INSERT INTO gam_events (usuario_id, rule_key, pontos, ref_tipo, ref_id, meta)
  VALUES (p_usuario_id, p_rule_key, p_pontos, p_ref_tipo, p_ref_id, p_meta);
  
  -- Upsert monthly points
  INSERT INTO gam_user_monthly (usuario_id, ano, mes, pontos)
  VALUES (p_usuario_id, current_ano, current_mes, p_pontos)
  ON CONFLICT (usuario_id, ano, mes)
  DO UPDATE SET 
    pontos = gam_user_monthly.pontos + p_pontos,
    updated_at = now();
  
  -- Get updated points
  SELECT pontos INTO current_pontos
  FROM gam_user_monthly 
  WHERE usuario_id = p_usuario_id AND ano = current_ano AND mes = current_mes;
  
  -- Calculate tier and discount
  IF current_pontos >= 900 THEN
    new_tier := 'Elite';
    new_desconto := 50;
  ELSIF current_pontos >= 600 THEN
    new_tier := 'Premium';
    new_desconto := 25;
  ELSIF current_pontos >= 300 THEN
    new_tier := 'Participativo';
    new_desconto := 10;
  ELSE
    new_tier := 'Sem Desconto';
    new_desconto := 0;
  END IF;
  
  -- Calculate badges
  new_badges := calculate_user_badges(p_usuario_id, current_ano, current_mes);
  
  -- Update tier, discount, and badges
  UPDATE gam_user_monthly 
  SET 
    tier = new_tier,
    desconto_percent = new_desconto,
    badges = new_badges,
    updated_at = now()
  WHERE usuario_id = p_usuario_id AND ano = current_ano AND mes = current_mes;
  
  -- Update visibility boost
  PERFORM update_visibility_boost(p_usuario_id);
END;
$$;

-- Calculate user badges for current month
CREATE OR REPLACE FUNCTION calculate_user_badges(
  p_usuario_id UUID,
  p_ano INTEGER,
  p_mes INTEGER
) RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badges TEXT[] := '{}';
  fast_response_count INTEGER;
  total_matches INTEGER;
  quality_properties INTEGER;
  avg_rating NUMERIC;
  rating_count INTEGER;
BEGIN
  -- Fast responder badge (>90% matches answered within 1h)
  SELECT 
    COUNT(*) FILTER (WHERE ge.rule_key = 'match_1h'),
    COUNT(*) FILTER (WHERE ge.rule_key IN ('match_1h', 'match_12h', 'match_24h'))
  INTO fast_response_count, total_matches
  FROM gam_events ge
  WHERE ge.usuario_id = p_usuario_id
    AND EXTRACT(YEAR FROM ge.created_at AT TIME ZONE 'America/Bahia') = p_ano
    AND EXTRACT(MONTH FROM ge.created_at AT TIME ZONE 'America/Bahia') = p_mes;
  
  IF total_matches > 0 AND (fast_response_count::NUMERIC / total_matches::NUMERIC) >= 0.9 THEN
    badges := array_append(badges, 'fast_responder');
  END IF;
  
  -- Premium advertiser badge (≥5 high quality properties with 8+ photos)
  SELECT COUNT(*)
  INTO quality_properties
  FROM imoveis_quality iq
  WHERE iq.corretor_id = p_usuario_id
    AND iq.percentual >= 90
    AND iq.tem_8_fotos = true;
  
  IF quality_properties >= 5 THEN
    badges := array_append(badges, 'anunciante_premium');
  END IF;
  
  -- Gold partner badge (average rating ≥4.8 with minimum 5 reviews)
  -- This would need reviews table - placeholder for now
  -- SELECT AVG(estrelas), COUNT(*) INTO avg_rating, rating_count
  -- FROM avaliacoes WHERE para_id = p_usuario_id;
  -- IF rating_count >= 5 AND avg_rating >= 4.8 THEN
  --   badges := array_append(badges, 'parceiro_ouro');
  -- END IF;
  
  RETURN badges;
END;
$$;

-- Update visibility boost based on tier
CREATE OR REPLACE FUNCTION update_visibility_boost(p_usuario_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tier TEXT;
  boost_value NUMERIC := 1.0;
  is_champion BOOLEAN := false;
BEGIN
  -- Get current tier
  SELECT tier INTO current_tier
  FROM gam_user_monthly gum
  WHERE gum.usuario_id = p_usuario_id
    AND gum.ano = EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Bahia')
    AND gum.mes = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Bahia');
  
  -- Check if was champion last month
  SELECT COUNT(*) > 0 INTO is_champion
  FROM gam_user_history guh
  WHERE guh.usuario_id = p_usuario_id
    AND guh.was_champion = true
    AND guh.fechado_em >= NOW() - INTERVAL '30 days';
  
  -- Calculate boost
  IF is_champion THEN
    boost_value := 1.35;
  ELSIF current_tier = 'Elite' THEN
    boost_value := 1.25;
  ELSIF current_tier = 'Premium' THEN
    boost_value := 1.12;
  ELSIF current_tier = 'Participativo' THEN
    boost_value := 1.05;
  END IF;
  
  -- Upsert visibility boost
  INSERT INTO gam_visibility_boost (usuario_id, boost, expires_at)
  VALUES (p_usuario_id, boost_value, 
    CASE WHEN is_champion THEN NOW() + INTERVAL '30 days' ELSE NULL END)
  ON CONFLICT (usuario_id)
  DO UPDATE SET 
    boost = boost_value,
    expires_at = CASE WHEN is_champion THEN NOW() + INTERVAL '30 days' ELSE NULL END,
    updated_at = NOW();
END;
$$;

-- Monthly reset and archival function
CREATE OR REPLACE FUNCTION process_monthly_gamification_reset()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_month_ano INTEGER;
  last_month_mes INTEGER;
  champion_id UUID;
  processed_count INTEGER := 0;
BEGIN
  -- Calculate last month in America/Bahia timezone
  SELECT 
    EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'America/Bahia' - INTERVAL '1 month'))::INTEGER,
    EXTRACT(MONTH FROM (NOW() AT TIME ZONE 'America/Bahia' - INTERVAL '1 month'))::INTEGER
  INTO last_month_ano, last_month_mes;
  
  -- Find last month's champion (highest points)
  SELECT usuario_id INTO champion_id
  FROM gam_user_monthly
  WHERE ano = last_month_ano AND mes = last_month_mes
  ORDER BY pontos DESC
  LIMIT 1;
  
  -- Archive last month's data to history
  INSERT INTO gam_user_history (usuario_id, ano, mes, pontos, tier, desconto_percent, badges, was_champion)
  SELECT 
    usuario_id, ano, mes, pontos, tier, desconto_percent, badges,
    (usuario_id = champion_id)
  FROM gam_user_monthly
  WHERE ano = last_month_ano AND mes = last_month_mes;
  
  GET DIAGNOSTICS processed_count = ROW_COUNT;
  
  -- Create free month credit for champion
  IF champion_id IS NOT NULL THEN
    INSERT INTO assinaturas_creditos (usuario_id, tipo, valor, referencia_ano_mes)
    VALUES (champion_id, 'free_month', 100, last_month_ano * 100 + last_month_mes);
  END IF;
  
  -- Reset current month (keep structure, zero points)
  UPDATE gam_user_monthly
  SET 
    pontos = 0,
    tier = 'Sem Desconto',
    desconto_percent = 0,
    badges = '{}',
    updated_at = NOW()
  WHERE ano = last_month_ano AND mes = last_month_mes;
  
  -- Update all visibility boosts
  PERFORM update_visibility_boost(usuario_id) 
  FROM conectaios_brokers WHERE status = 'active';
  
  RETURN json_build_object(
    'success', true,
    'processed_users', processed_count,
    'champion_id', champion_id,
    'reset_month', last_month_ano || '-' || LPAD(last_month_mes::TEXT, 2, '0')
  );
END;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all gamification tables
ALTER TABLE gam_points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gam_user_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE gam_user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gam_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gam_visibility_boost ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas_creditos ENABLE ROW LEVEL SECURITY;

-- Policies for gam_user_monthly
CREATE POLICY "Users can view own monthly data" ON gam_user_monthly
  FOR SELECT USING (
    usuario_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
  );

-- Policies for gam_events  
CREATE POLICY "Users can view own events" ON gam_events
  FOR SELECT USING (
    usuario_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
  );

-- Policies for gam_user_history
CREATE POLICY "Users can view own history" ON gam_user_history
  FOR SELECT USING (
    usuario_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
  );

-- Public read policies for reference tables
CREATE POLICY "Anyone can view points rules" ON gam_points_rules
  FOR SELECT USING (ativo = true);

CREATE POLICY "Anyone can view badges definitions" ON gam_badges
  FOR SELECT USING (true);

-- Policies for visibility boost
CREATE POLICY "Users can view own visibility boost" ON gam_visibility_boost
  FOR SELECT USING (
    usuario_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
  );

-- Policies for credits
CREATE POLICY "Users can view own credits" ON assinaturas_creditos
  FOR SELECT USING (
    usuario_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- Points rules
INSERT INTO gam_points_rules (key, label, pontos, descricao) VALUES
  ('match_1h', 'Resposta rápida (<1h)', 10, 'Respondeu a um match em menos de 1 hora'),
  ('match_12h', 'Resposta em 12h', 5, 'Respondeu a um match em menos de 12 horas'),
  ('match_24h', 'Resposta em 24h', 2, 'Respondeu a um match em menos de 24 horas'),
  ('anuncio_qualidade_90', 'Anúncio de qualidade', 15, 'Anúncio com 90%+ de qualidade'),
  ('anuncio_vendido_alugado', 'Negócio fechado', 25, 'Anúncio vendido ou alugado'),
  ('anuncio_8_fotos', 'Anúncio completo', 5, 'Anúncio com 8 ou mais fotos'),
  ('compartilhamento_social', 'Compartilhamento', 3, 'Compartilhou anúncio nas redes sociais'),
  ('avaliacao_5', 'Avaliação 5 estrelas', 10, 'Recebeu avaliação de 5 estrelas'),
  ('avaliacao_4', 'Avaliação 4 estrelas', 5, 'Recebeu avaliação de 4 estrelas'),
  ('interacao_social', 'Interação social', 1, 'Interação nas redes sociais (like, comment)')
ON CONFLICT (key) DO NOTHING;

-- Badge definitions
INSERT INTO gam_badges (slug, label, descricao, icone, prioridade) VALUES
  ('fast_responder', 'Resposta Rápida', 'Respondeu >90% dos matches em menos de 1 hora', '⚡', 10),
  ('anunciante_premium', 'Anunciante Premium', 'Mantém 5+ anúncios de alta qualidade', '🏆', 20),
  ('parceiro_ouro', 'Parceiro Ouro', 'Média de avaliações ≥4.8 estrelas', '🥇', 30),
  ('champion', 'Campeão do Mês', 'Foi o #1 do mês anterior', '👑', 100)
ON CONFLICT (slug) DO NOTHING;