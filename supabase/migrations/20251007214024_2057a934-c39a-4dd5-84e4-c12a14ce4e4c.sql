-- ============================================
-- FASE 2: SISTEMA DE PARCERIAS ENTRE CORRETORES
-- ============================================

-- Tabela principal de parcerias
CREATE TABLE IF NOT EXISTS public.broker_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.imoveis(id) ON DELETE CASCADE NOT NULL,
  property_owner_id UUID NOT NULL,
  initiated_by UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'expired', 'cancelled')),
  
  commission_split JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMPTZ,
  contract_text TEXT
);

-- Participantes da parceria
CREATE TABLE IF NOT EXISTS public.partnership_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID REFERENCES public.broker_partnerships(id) ON DELETE CASCADE NOT NULL,
  broker_id UUID NOT NULL,
  
  role TEXT NOT NULL CHECK (role IN ('owner', 'partner_1', 'partner_2', 'partner_3')),
  commission_percentage NUMERIC NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  
  signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  signature_ip TEXT,
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID NOT NULL,
  
  UNIQUE(partnership_id, broker_id)
);

-- Propostas e contrapropostas
CREATE TABLE IF NOT EXISTS public.partnership_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID REFERENCES public.broker_partnerships(id) ON DELETE CASCADE NOT NULL,
  proposed_by UUID NOT NULL,
  
  proposed_split JSONB NOT NULL DEFAULT '{}'::jsonb,
  message TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'superseded')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Assinaturas digitais
CREATE TABLE IF NOT EXISTS public.partnership_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID REFERENCES public.broker_partnerships(id) ON DELETE CASCADE NOT NULL,
  broker_id UUID NOT NULL,
  
  password_hash TEXT NOT NULL,
  
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  
  UNIQUE(partnership_id, broker_id)
);

-- Enable RLS
ALTER TABLE public.broker_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies para broker_partnerships
CREATE POLICY "participants_view_partnerships"
ON public.broker_partnerships FOR SELECT
USING (
  property_owner_id = auth.uid() 
  OR initiated_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.partnership_participants
    WHERE partnership_id = broker_partnerships.id
    AND broker_id = auth.uid()
  )
);

CREATE POLICY "participants_update_partnerships"
ON public.broker_partnerships FOR UPDATE
USING (
  property_owner_id = auth.uid()
  OR initiated_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.partnership_participants
    WHERE partnership_id = broker_partnerships.id
    AND broker_id = auth.uid()
  )
);

CREATE POLICY "participants_insert_partnerships"
ON public.broker_partnerships FOR INSERT
WITH CHECK (
  initiated_by = auth.uid()
);

-- RLS Policies para partnership_participants
CREATE POLICY "participants_view_own"
ON public.partnership_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.broker_partnerships p
    WHERE p.id = partnership_participants.partnership_id
    AND (
      p.property_owner_id = auth.uid()
      OR p.initiated_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.partnership_participants pp
        WHERE pp.partnership_id = p.id
        AND pp.broker_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "participants_manage_own"
ON public.partnership_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.broker_partnerships p
    WHERE p.id = partnership_participants.partnership_id
    AND (
      p.property_owner_id = auth.uid()
      OR p.initiated_by = auth.uid()
    )
  )
);

-- RLS Policies para partnership_proposals
CREATE POLICY "proposals_view_own"
ON public.partnership_proposals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.broker_partnerships p
    WHERE p.id = partnership_proposals.partnership_id
    AND (
      p.property_owner_id = auth.uid()
      OR p.initiated_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.partnership_participants pp
        WHERE pp.partnership_id = p.id
        AND pp.broker_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "proposals_manage_own"
ON public.partnership_proposals FOR ALL
USING (
  proposed_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.broker_partnerships p
    WHERE p.id = partnership_proposals.partnership_id
    AND (
      p.property_owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.partnership_participants pp
        WHERE pp.partnership_id = p.id
        AND pp.broker_id = auth.uid()
      )
    )
  )
);

-- RLS Policies para partnership_signatures
CREATE POLICY "signatures_view_own"
ON public.partnership_signatures FOR SELECT
USING (
  broker_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.broker_partnerships p
    WHERE p.id = partnership_signatures.partnership_id
    AND (
      p.property_owner_id = auth.uid()
      OR p.initiated_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.partnership_participants pp
        WHERE pp.partnership_id = p.id
        AND pp.broker_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "signatures_insert_own"
ON public.partnership_signatures FOR INSERT
WITH CHECK (broker_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_partnerships_property ON public.broker_partnerships(property_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_owner ON public.broker_partnerships(property_owner_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON public.broker_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_participants_partnership ON public.partnership_participants(partnership_id);
CREATE INDEX IF NOT EXISTS idx_participants_broker ON public.partnership_participants(broker_id);
CREATE INDEX IF NOT EXISTS idx_proposals_partnership ON public.partnership_proposals(partnership_id);
CREATE INDEX IF NOT EXISTS idx_signatures_partnership ON public.partnership_signatures(partnership_id);