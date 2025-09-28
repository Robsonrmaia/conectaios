-- Remove SECURITY DEFINER from search_properties to avoid security warnings
DROP FUNCTION IF EXISTS public.search_properties(text,text,text,int,int);
CREATE OR REPLACE FUNCTION public.search_properties(
  q text DEFAULT '',
  city_filter text DEFAULT NULL,
  purpose_filter text DEFAULT NULL,
  limit_rows int DEFAULT 50,
  offset_rows int DEFAULT 0
) RETURNS SETOF public.imoveis
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT * FROM public.search_imoveis(q, city_filter, purpose_filter, limit_rows, offset_rows);
$$;