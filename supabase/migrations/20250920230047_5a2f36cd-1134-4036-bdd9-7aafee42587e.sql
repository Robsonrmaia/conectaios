-- Limpeza dos registros duplicados da Gisele, mantendo apenas o correto
-- Manter apenas o registro com username 'giselecorretor' e user_id onde estão as propriedades

-- Primeiro, vamos identificar e manter apenas o registro correto da Gisele
DELETE FROM conectaios_brokers 
WHERE email = 'gisele@corretor.com' 
AND id != '08ab7af3-2128-4af7-a078-0a078d608901';

-- Garantir que o registro correto tem os dados atualizados
UPDATE conectaios_brokers 
SET 
  name = 'Gisele Corretor',
  username = 'giselecorretor',
  status = 'active',
  updated_at = now()
WHERE id = '08ab7af3-2128-4af7-a078-0a078d608901';

-- Verificar se existe configuração de minisite para este broker
INSERT INTO minisite_configs (broker_id, title, description, primary_color, secondary_color, is_enabled)
VALUES (
  '08ab7af3-2128-4af7-a078-0a078d608901',
  'Gisele Corretor',
  'Especialista em imóveis residenciais e comerciais',
  '#2563eb',
  '#f1f5f9',
  true
)
ON CONFLICT (broker_id) DO UPDATE SET
  is_enabled = true,
  updated_at = now();