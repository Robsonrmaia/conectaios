-- Criar função para gerar tokens únicos de submissão
CREATE OR REPLACE FUNCTION public.generate_submission_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Gerar token aleatório de 32 caracteres
    new_token := encode(gen_random_bytes(24), 'base64');
    new_token := replace(replace(replace(new_token, '+', ''), '/', ''), '=', '');
    new_token := substring(new_token, 1, 32);
    
    -- Verificar se token já existe
    SELECT EXISTS(
      SELECT 1 FROM public.property_submissions 
      WHERE submission_token = new_token
    ) INTO token_exists;
    
    -- Se não existe, retornar o token
    IF NOT token_exists THEN
      RETURN new_token;
    END IF;
  END LOOP;
END;
$$;

-- Adicionar colunas de consentimento se não existirem
ALTER TABLE public.property_submissions 
ADD COLUMN IF NOT EXISTS consent_ip_address text;

ALTER TABLE public.property_submissions 
ADD COLUMN IF NOT EXISTS consent_timestamp timestamp with time zone;