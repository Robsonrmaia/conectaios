-- Initialize gamification data for existing users
INSERT INTO gam_user_monthly (usuario_id, ano, mes, pontos, tier, desconto_percent, badges)
SELECT 
  cb.id as usuario_id,
  EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Bahia')::INTEGER as ano,
  EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Bahia')::INTEGER as mes,
  0 as pontos,
  'Sem Desconto' as tier,
  0 as desconto_percent,
  ARRAY[]::TEXT[] as badges
FROM conectaios_brokers cb
WHERE cb.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM gam_user_monthly gum 
    WHERE gum.usuario_id = cb.id 
    AND gum.ano = EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Bahia')::INTEGER
    AND gum.mes = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Bahia')::INTEGER
  );