-- Corrigir view removendo SECURITY DEFINER
DROP VIEW IF EXISTS public.v_public_properties;

-- Recriar view sem SECURITY DEFINER (será SECURITY INVOKER por padrão)
CREATE OR REPLACE VIEW public.v_public_properties AS
SELECT 
  id,
  titulo,
  slug,
  thumb_url,
  preco,
  bairro,
  cidade,
  quartos,
  banheiros,
  COALESCE(area_privativa, area_total) as metragem,
  updated_at as created_at,
  finalidade,
  tipo,
  endereco,
  area_total,
  area_privativa,
  vagas,
  galeria_urls,
  descricao,
  source_portal
FROM public.properties
WHERE is_public = true AND visibility = 'public_site' AND status != 'INATIVO';

-- Corrigir função adicionando SET search_path
CREATE OR REPLACE FUNCTION public.generate_property_slug(p_titulo text, p_cidade text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Criar slug base
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        translate(COALESCE(p_titulo, '') || '-' || COALESCE(p_cidade, ''), 
                 'àáâãäèéêëìíîïòóôõöùúûüçÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÇ',
                 'aaaaaeeeeiiiioooouuuucAAAAEEEEIIIIOOOOUUUUC'),
        '[^a-zA-Z0-9\-]', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  
  -- Remover hífens do início e fim
  base_slug := trim(base_slug, '-');
  
  -- Garantir que não está vazio
  IF length(base_slug) < 3 THEN
    base_slug := 'imovel-' || extract(epoch from now())::bigint;
  END IF;
  
  final_slug := base_slug;
  
  -- Verificar unicidade e adicionar counter se necessário
  WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;