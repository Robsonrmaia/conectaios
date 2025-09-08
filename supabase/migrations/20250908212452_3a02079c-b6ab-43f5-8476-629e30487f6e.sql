-- Corrigir propriedades existentes que não têm user_id
-- Associar propriedades aos primeiros usuários cadastrados como exemplo

UPDATE properties 
SET user_id = (
  SELECT user_id 
  FROM conectaios_brokers 
  WHERE conectaios_brokers.username IS NOT NULL 
  LIMIT 1
)
WHERE user_id IS NULL;

UPDATE conectaios_properties 
SET user_id = (
  SELECT user_id 
  FROM conectaios_brokers 
  WHERE conectaios_brokers.username IS NOT NULL 
  LIMIT 1
)
WHERE user_id IS NULL;