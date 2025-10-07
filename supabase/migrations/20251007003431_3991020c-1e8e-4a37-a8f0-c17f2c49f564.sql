-- ========================================
-- PARTE 1: Sistema de Negociações Completo
-- ========================================

-- Tabela de propostas de imóveis
CREATE TABLE IF NOT EXISTS public.property_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.imoveis(id) ON DELETE CASCADE NOT NULL,
  broker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  offer_amount NUMERIC NOT NULL,
  financing_type TEXT DEFAULT 'financiado',
  down_payment NUMERIC,
  financing_amount NUMERIC,
  conditions TEXT,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired', 'countered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contrapropostas
CREATE TABLE IF NOT EXISTS public.counter_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.property_proposals(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  offer_amount NUMERIC NOT NULL,
  down_payment NUMERIC,
  financing_amount NUMERIC,
  conditions TEXT,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de parceiros em negociações (terceiros)
CREATE TABLE IF NOT EXISTS public.deal_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_name TEXT NOT NULL,
  partner_email TEXT,
  partner_phone TEXT,
  partner_role TEXT NOT NULL CHECK (partner_role IN ('broker', 'investor', 'consultant', 'lawyer', 'other')),
  commission_percentage NUMERIC CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  notes TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- RLS Policies para Propostas
-- ========================================

ALTER TABLE public.property_proposals ENABLE ROW LEVEL SECURITY;

-- Proprietários do imóvel podem ver e gerenciar propostas
CREATE POLICY "Property owners can manage proposals"
ON public.property_proposals
FOR ALL
TO authenticated
USING (
  broker_id = auth.uid() OR
  property_id IN (
    SELECT id FROM public.imoveis WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  broker_id = auth.uid() OR
  property_id IN (
    SELECT id FROM public.imoveis WHERE owner_id = auth.uid()
  )
);

-- ========================================
-- RLS Policies para Contrapropostas
-- ========================================

ALTER TABLE public.counter_proposals ENABLE ROW LEVEL SECURITY;

-- Participantes da proposta podem ver contrapropostas
CREATE POLICY "Proposal participants can view counter proposals"
ON public.counter_proposals
FOR SELECT
TO authenticated
USING (
  proposal_id IN (
    SELECT id FROM public.property_proposals
    WHERE broker_id = auth.uid() OR
    property_id IN (SELECT id FROM public.imoveis WHERE owner_id = auth.uid())
  )
);

-- Participantes podem criar contrapropostas
CREATE POLICY "Proposal participants can create counter proposals"
ON public.counter_proposals
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  proposal_id IN (
    SELECT id FROM public.property_proposals
    WHERE broker_id = auth.uid() OR
    property_id IN (SELECT id FROM public.imoveis WHERE owner_id = auth.uid())
  )
);

-- ========================================
-- RLS Policies para Parceiros
-- ========================================

ALTER TABLE public.deal_partners ENABLE ROW LEVEL SECURITY;

-- Dono do negócio pode gerenciar parceiros
CREATE POLICY "Deal owner can manage partners"
ON public.deal_partners
FOR ALL
TO authenticated
USING (
  deal_id IN (
    SELECT id FROM public.deals WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  deal_id IN (
    SELECT id FROM public.deals WHERE user_id = auth.uid()
  )
);

-- ========================================
-- Triggers para updated_at
-- ========================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_proposals_updated_at
  BEFORE UPDATE ON public.property_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ========================================
-- Índices para Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_property_proposals_property_id ON public.property_proposals(property_id);
CREATE INDEX IF NOT EXISTS idx_property_proposals_broker_id ON public.property_proposals(broker_id);
CREATE INDEX IF NOT EXISTS idx_property_proposals_status ON public.property_proposals(status);
CREATE INDEX IF NOT EXISTS idx_counter_proposals_proposal_id ON public.counter_proposals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_deal_partners_deal_id ON public.deal_partners(deal_id);

-- ========================================
-- PARTE 2: Sistema de Transferência Admin
-- ========================================

-- Tabela de histórico de transferências de propriedades
CREATE TABLE IF NOT EXISTS public.property_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.imoveis(id) ON DELETE CASCADE NOT NULL,
  from_broker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_broker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transferred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  reason TEXT,
  support_ticket_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para transferências (apenas admins)
ALTER TABLE public.property_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view transfers"
ON public.property_transfers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can create transfers"
ON public.property_transfers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Índice
CREATE INDEX IF NOT EXISTS idx_property_transfers_property_id ON public.property_transfers(property_id);
CREATE INDEX IF NOT EXISTS idx_property_transfers_from_broker ON public.property_transfers(from_broker_id);
CREATE INDEX IF NOT EXISTS idx_property_transfers_to_broker ON public.property_transfers(to_broker_id);