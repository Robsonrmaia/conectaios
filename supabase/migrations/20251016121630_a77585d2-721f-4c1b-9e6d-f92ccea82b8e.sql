-- Tabela para armazenar links compartilhados únicos
CREATE TABLE IF NOT EXISTS public.property_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  property_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_channel TEXT NOT NULL DEFAULT 'whatsapp',
  share_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 0,
  first_view_at TIMESTAMP WITH TIME ZONE,
  last_view_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear cada visualização
CREATE TABLE IF NOT EXISTS public.property_link_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id UUID NOT NULL REFERENCES public.property_share_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear interações na página
CREATE TABLE IF NOT EXISTS public.property_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_link_id UUID NOT NULL REFERENCES public.property_share_links(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  interaction_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.property_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_link_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas para property_share_links
CREATE POLICY "Brokers can view their own share links"
  ON public.property_share_links FOR SELECT
  USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can create share links"
  ON public.property_share_links FOR INSERT
  WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Brokers can update their own share links"
  ON public.property_share_links FOR UPDATE
  USING (auth.uid() = broker_id);

-- Políticas para property_link_views (público pode inserir, corretor vê suas visualizações)
CREATE POLICY "Anyone can record views"
  ON public.property_link_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Brokers can view their link views"
  ON public.property_link_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_share_links
      WHERE property_share_links.id = property_link_views.share_link_id
      AND property_share_links.broker_id = auth.uid()
    )
  );

-- Políticas para property_interactions
CREATE POLICY "Anyone can record interactions"
  ON public.property_interactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Brokers can view their interactions"
  ON public.property_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_share_links
      WHERE property_share_links.id = property_interactions.share_link_id
      AND property_share_links.broker_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_property_share_links_share_id ON public.property_share_links(share_id);
CREATE INDEX IF NOT EXISTS idx_property_share_links_broker_id ON public.property_share_links(broker_id);
CREATE INDEX IF NOT EXISTS idx_property_share_links_property_id ON public.property_share_links(property_id);
CREATE INDEX IF NOT EXISTS idx_property_link_views_share_link_id ON public.property_link_views(share_link_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_share_link_id ON public.property_interactions(share_link_id);

-- Função para atualizar contador de visualizações
CREATE OR REPLACE FUNCTION public.update_share_link_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.property_share_links
  SET 
    view_count = view_count + 1,
    last_view_at = NEW.viewed_at,
    first_view_at = COALESCE(first_view_at, NEW.viewed_at)
  WHERE id = NEW.share_link_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar contador automaticamente
CREATE TRIGGER trigger_update_share_link_view_count
  AFTER INSERT ON public.property_link_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_share_link_view_count();