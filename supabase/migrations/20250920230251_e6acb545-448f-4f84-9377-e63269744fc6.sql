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