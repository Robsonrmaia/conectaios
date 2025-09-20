-- Limpar dados duplicados da Gisele e configurar username correto
-- Primeiro, vamos deletar todos os registros duplicados, mantendo apenas o mais antigo
DELETE FROM minisite_configs 
WHERE broker_id IN (
  SELECT id FROM conectaios_brokers 
  WHERE email ILIKE '%gisele%' 
  AND id != '08ab7af3-2128-4af7-a078-0a078d608901'
);

-- Deletar todos os brokers duplicados, mantendo apenas o original
DELETE FROM conectaios_brokers 
WHERE email ILIKE '%gisele%' 
AND id != '08ab7af3-2128-4af7-a078-0a078d608901';

-- Atualizar o broker original com os dados corretos
UPDATE conectaios_brokers 
SET 
  name = 'Gisele Corretora',
  username = 'giselecorretora',
  email = 'giselecarneirocorretora@gmail.com',
  status = 'active',
  updated_at = now()
WHERE id = '08ab7af3-2128-4af7-a078-0a078d608901';

-- Atualizar a configuração do minisite para usar o novo username
UPDATE minisite_configs 
SET 
  title = 'Gisele Corretora',
  generated_url = '/broker/giselecorretora',
  updated_at = now()
WHERE broker_id = '08ab7af3-2128-4af7-a078-0a078d608901';