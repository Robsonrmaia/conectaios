-- Gerar códigos de referência para brokers existentes que não têm
UPDATE brokers 
SET referral_code = 'REF' || substr(replace(id::text, '-', ''), 1, 8)
WHERE referral_code IS NULL OR referral_code = '';

-- Criar função para garantir que sempre tenha referral_code ao inserir
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não tem referral_code, gera um
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := 'REF' || substr(replace(NEW.id::text, '-', ''), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar antes de inserir ou atualizar
DROP TRIGGER IF EXISTS trigger_ensure_referral_code ON brokers;
CREATE TRIGGER trigger_ensure_referral_code
  BEFORE INSERT OR UPDATE ON brokers
  FOR EACH ROW
  EXECUTE FUNCTION ensure_referral_code();

-- Atualizar a view para incluir referral_code
DROP VIEW IF EXISTS vw_current_broker;
CREATE VIEW vw_current_broker 
WITH (security_invoker = true)
AS
SELECT 
  b.id as broker_id,
  b.user_id,
  COALESCE(b.name, p.name) as display_name,
  b.phone,
  b.bio,
  b.creci,
  b.username,
  COALESCE(b.avatar_url, p.avatar_url) as avatar_url,
  b.whatsapp,
  b.referral_code,
  b.status,
  b.subscription_status
FROM brokers b
LEFT JOIN profiles p ON p.id = b.user_id;

COMMENT ON VIEW vw_current_broker IS 'Unified broker view with referral code';
GRANT SELECT ON vw_current_broker TO authenticated;