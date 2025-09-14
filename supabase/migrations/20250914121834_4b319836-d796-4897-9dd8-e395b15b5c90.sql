-- Criar apenas índices básicos para otimizar performance
CREATE INDEX IF NOT EXISTS idx_conectaios_properties_marketplace 
ON public.conectaios_properties (user_id, is_public, visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conectaios_brokers_active 
ON public.conectaios_brokers (user_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_properties_user_created 
ON public.conectaios_properties (user_id, created_at DESC);