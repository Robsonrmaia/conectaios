-- ============================================================================
-- Fix Security Issues - Set search_path for all functions
-- ============================================================================

-- Fix function security issues by setting search_path

-- 1. Fix calc_imovel_quality function
CREATE OR REPLACE FUNCTION calc_imovel_quality(imovel_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 2. Fix apply_points function
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
SET search_path = public
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

-- 3. Fix calculate_user_badges function
CREATE OR REPLACE FUNCTION calculate_user_badges(
  p_usuario_id UUID,
  p_ano INTEGER,
  p_mes INTEGER
) RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  RETURN badges;
END;
$$;

-- 4. Fix update_visibility_boost function
CREATE OR REPLACE FUNCTION update_visibility_boost(p_usuario_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 5. Fix process_monthly_gamification_reset function
CREATE OR REPLACE FUNCTION process_monthly_gamification_reset()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 6. Replace security definer view with regular view
DROP VIEW IF EXISTS imoveis_quality;
CREATE VIEW imoveis_quality AS
SELECT 
  p.id as imovel_id,
  p.user_id as corretor_id,
  calc_imovel_quality(p.id) as percentual,
  COALESCE(array_length(p.fotos, 1), 0) >= 8 as tem_8_fotos,
  p.updated_at
FROM properties p
WHERE p.is_public = true;