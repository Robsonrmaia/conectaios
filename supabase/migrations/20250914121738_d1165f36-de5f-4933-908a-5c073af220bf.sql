-- Criar índices compostos para otimizar queries mais comuns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conectaios_properties_marketplace 
ON public.conectaios_properties (user_id, is_public, visibility, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conectaios_brokers_active 
ON public.conectaios_brokers (user_id, status) WHERE status = 'active';

-- Criar view materializada para marketplace com dados pré-calculados
CREATE MATERIALIZED VIEW IF NOT EXISTS public.marketplace_properties_view AS
SELECT 
    p.id,
    p.user_id,
    p.titulo as title,
    p.valor as price,
    p.area,
    p.quartos,
    p.bathrooms,
    p.parking_spots,
    p.listing_type,
    p.property_type,
    p.fotos as photos,
    p.city,
    p.neighborhood,
    p.descricao as description,
    p.created_at,
    b.name as broker_name,
    b.avatar_url as broker_avatar,
    b.phone as broker_phone,
    b.creci as broker_creci
FROM public.conectaios_properties p
INNER JOIN public.conectaios_brokers b ON p.user_id = b.user_id
WHERE p.is_public = true 
AND p.visibility = 'public_site'
AND b.status = 'active'
ORDER BY p.created_at DESC;

-- Criar índice na view materializada
CREATE INDEX IF NOT EXISTS idx_marketplace_view_created_at 
ON public.marketplace_properties_view (created_at DESC);

-- Permitir acesso público à view
ALTER MATERIALIZED VIEW public.marketplace_properties_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view marketplace properties" 
ON public.marketplace_properties_view
FOR SELECT 
USING (true);

-- Função para refresh automático da view
CREATE OR REPLACE FUNCTION refresh_marketplace_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.marketplace_properties_view;
END;
$$;