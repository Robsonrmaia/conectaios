-- Create client_searches table for saved client property searches
CREATE TABLE public.client_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  property_type TEXT NOT NULL DEFAULT 'apartamento',
  listing_type TEXT NOT NULL DEFAULT 'venda',
  max_price NUMERIC,
  min_price NUMERIC,
  min_bedrooms INTEGER,
  max_bedrooms INTEGER,
  min_bathrooms INTEGER,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  min_area NUMERIC,
  max_area NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_match_at TIMESTAMP WITH TIME ZONE,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own client searches" 
ON public.client_searches 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_client_searches_updated_at
BEFORE UPDATE ON public.client_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for intelligent property matching with scoring
CREATE OR REPLACE FUNCTION public.find_intelligent_property_matches(search_id UUID)
RETURNS TABLE(
  property_id UUID,
  match_score INTEGER,
  match_reasons TEXT[],
  property_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_criteria client_searches%ROWTYPE;
BEGIN
  -- Get search criteria
  SELECT * INTO search_criteria FROM client_searches WHERE id = search_id;
  
  IF search_criteria.id IS NULL THEN
    RAISE EXCEPTION 'Search not found';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as property_id,
    CASE 
      -- Perfect matches get high scores
      WHEN p.property_type = search_criteria.property_type 
           AND p.listing_type = search_criteria.listing_type
           AND p.valor BETWEEN COALESCE(search_criteria.min_price, 0) AND search_criteria.max_price
           AND p.quartos BETWEEN COALESCE(search_criteria.min_bedrooms, 0) AND COALESCE(search_criteria.max_bedrooms, 10)
           AND (search_criteria.city IS NULL OR p.city ILIKE '%' || search_criteria.city || '%')
           AND (search_criteria.neighborhood IS NULL OR p.neighborhood ILIKE '%' || search_criteria.neighborhood || '%')
           THEN 95
      
      -- Good matches with some criteria met
      WHEN p.property_type = search_criteria.property_type 
           AND p.listing_type = search_criteria.listing_type
           AND p.valor <= search_criteria.max_price * 1.1 -- 10% tolerance
           AND p.quartos >= COALESCE(search_criteria.min_bedrooms, 0)
           THEN 80
      
      -- Acceptable matches with type and listing type
      WHEN p.property_type = search_criteria.property_type 
           AND p.listing_type = search_criteria.listing_type
           AND p.valor <= search_criteria.max_price * 1.2 -- 20% tolerance
           THEN 65
      
      -- Basic matches with just listing type
      WHEN p.listing_type = search_criteria.listing_type
           AND p.valor <= search_criteria.max_price * 1.3 -- 30% tolerance
           THEN 50
      
      ELSE 30
    END as match_score,
    
    -- Build match reasons array
    ARRAY[
      CASE WHEN p.property_type = search_criteria.property_type THEN 'Tipo de imóvel compatível' END,
      CASE WHEN p.listing_type = search_criteria.listing_type THEN 'Finalidade compatível' END,
      CASE WHEN p.valor <= search_criteria.max_price THEN 'Preço dentro do orçamento' END,
      CASE WHEN p.quartos >= COALESCE(search_criteria.min_bedrooms, 0) THEN 'Quartos suficientes' END,
      CASE WHEN search_criteria.city IS NULL OR p.city ILIKE '%' || search_criteria.city || '%' THEN 'Cidade compatível' END,
      CASE WHEN search_criteria.neighborhood IS NULL OR p.neighborhood ILIKE '%' || search_criteria.neighborhood || '%' THEN 'Bairro compatível' END
    ]::TEXT[] as match_reasons,
    
    row_to_json(p)::JSONB as property_data
  FROM public.properties p
  WHERE p.is_public = true 
    AND p.visibility = 'public_site'
    AND p.user_id != search_criteria.user_id -- Don't match own properties
    AND p.valor <= search_criteria.max_price * 1.3 -- Max 30% over budget
  ORDER BY match_score DESC, p.created_at DESC
  LIMIT 20;
END;
$$;