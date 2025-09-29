-- 1) Adicionar colunas de compatibilidade na tabela imoveis
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 2) Criar índice único para upsert por feed (evita duplicidade)
CREATE UNIQUE INDEX IF NOT EXISTS imoveis_owner_source_external_udx
  ON public.imoveis(owner_id, source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;

-- 3) Preencher address com dados existentes (street, number, neighborhood, city, state)
UPDATE public.imoveis
SET address = CONCAT_WS(', ',
  NULLIF(street, ''),
  NULLIF(number, '')
) || CASE 
  WHEN neighborhood IS NOT NULL AND neighborhood <> '' THEN ' - ' || neighborhood 
  ELSE '' 
END || CASE 
  WHEN city IS NOT NULL AND city <> '' THEN ', ' || city 
  ELSE '' 
END || CASE 
  WHEN state IS NOT NULL AND state <> '' THEN '/' || state 
  ELSE '' 
END
WHERE address IS NULL;

-- 4) Dropar VIEW existente se existir
DROP VIEW IF EXISTS public.properties;

-- 5) Criar VIEW properties (camada de compatibilidade)
CREATE VIEW public.properties AS
SELECT
  i.id,
  i.owner_id,
  i.title,
  i.description,
  i.price,
  i.address,
  i.street AS logradouro,
  i.neighborhood AS bairro,
  i.city AS cidade,
  i.state AS uf,
  i.zipcode AS cep,
  i.number AS numero,
  NULL::numeric AS lat,
  NULL::numeric AS lng,
  i.area_total AS area,
  i.bedrooms,
  i.bathrooms,
  i.parking AS garages,
  i.type AS tipo,
  i.status,
  i.is_public AS is_published,
  i.source,
  i.external_id,
  i.created_at,
  i.updated_at,
  (
    SELECT ii.url
    FROM public.imovel_images ii
    WHERE ii.imovel_id = i.id
    ORDER BY ii.is_cover DESC NULLS LAST, ii.position ASC
    LIMIT 1
  ) AS thumb_url
FROM public.imoveis i;

-- 6) Forçar reload do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';