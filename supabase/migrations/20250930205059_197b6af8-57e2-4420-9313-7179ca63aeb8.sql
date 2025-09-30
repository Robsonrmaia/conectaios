-- Criar função para calcular qualidade do imóvel
-- Considera CEP e bairro como suficientes para localização
CREATE OR REPLACE FUNCTION public.calc_imovel_quality(imovel_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  quality_score numeric := 0;
  photo_count integer;
  desc_length integer;
BEGIN
  -- Buscar dados do imóvel
  SELECT 
    COALESCE(array_length(ARRAY(SELECT 1 FROM imovel_images WHERE imovel_images.imovel_id = calc_imovel_quality.imovel_id), 1), 0),
    COALESCE(length(description), 0)
  INTO photo_count, desc_length
  FROM imoveis
  WHERE id = imovel_id;

  -- Verificar campos obrigatórios
  -- Preço (15 pontos)
  IF EXISTS (SELECT 1 FROM imoveis WHERE id = imovel_id AND price > 0) THEN
    quality_score := quality_score + 15;
  END IF;

  -- Descrição (20 pontos: 10 se >= 300 chars, 20 se >= 600 chars)
  IF desc_length >= 600 THEN
    quality_score := quality_score + 20;
  ELSIF desc_length >= 300 THEN
    quality_score := quality_score + 10;
  END IF;

  -- Área (10 pontos)
  IF EXISTS (SELECT 1 FROM imoveis WHERE id = imovel_id AND area_total > 0) THEN
    quality_score := quality_score + 10;
  END IF;

  -- Quartos (10 pontos)
  IF EXISTS (SELECT 1 FROM imoveis WHERE id = imovel_id AND bedrooms >= 1) THEN
    quality_score := quality_score + 10;
  END IF;

  -- Endereço (10 pontos)
  IF EXISTS (SELECT 1 FROM imoveis WHERE id = imovel_id AND length(COALESCE(address, '')) > 10) THEN
    quality_score := quality_score + 10;
  END IF;

  -- Bairro (5 pontos)
  IF EXISTS (SELECT 1 FROM imoveis WHERE id = imovel_id AND neighborhood IS NOT NULL AND neighborhood != '') THEN
    quality_score := quality_score + 5;
  END IF;

  -- CEP OU Cidade (5 pontos) - aceita qualquer um dos dois
  IF EXISTS (
    SELECT 1 FROM imoveis 
    WHERE id = imovel_id 
    AND (
      (zipcode IS NOT NULL AND zipcode != '') 
      OR (city IS NOT NULL AND city != '')
    )
  ) THEN
    quality_score := quality_score + 5;
  END IF;

  -- Coordenadas GPS (5 pontos) - opcional, não obrigatório
  IF EXISTS (
    SELECT 1 FROM imoveis 
    WHERE id = imovel_id 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
  ) THEN
    quality_score := quality_score + 5;
  END IF;

  -- Fotos (20 pontos: 5 se >= 3, 10 se >= 5, 20 se >= 8)
  IF photo_count >= 8 THEN
    quality_score := quality_score + 20;
  ELSIF photo_count >= 5 THEN
    quality_score := quality_score + 10;
  ELSIF photo_count >= 3 THEN
    quality_score := quality_score + 5;
  END IF;

  RETURN quality_score;
END;
$$;