-- =====================================================
-- PARTE 0: CRIAR STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('docx-cliente-documentos', 'docx-cliente-documentos', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PARTE 1: CRIAR TABELAS DOCX_*
-- =====================================================

-- 1. Tabela docx_client_documents
CREATE TABLE IF NOT EXISTS public.docx_client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  client_type TEXT NOT NULL CHECK (client_type IN ('locador', 'locatario', 'fiador', 'conjuge_locador', 'conjuge_locatario')),
  document_category TEXT CHECK (document_category IN ('identificacao', 'comprovante_renda', 'comprovante_residencia', 'outros')),
  document_type TEXT DEFAULT 'identificacao',
  document_url TEXT NOT NULL,
  file_name TEXT,
  photo_url TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  confidence_score NUMERIC,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  nome TEXT,
  cpf TEXT,
  rg TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT
);

-- 2. Tabela docx_contract_data_bank
CREATE TABLE IF NOT EXISTS public.docx_contract_data_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  locador_data JSONB DEFAULT '{}'::jsonb,
  conjuge_locador_data JSONB DEFAULT '{}'::jsonb,
  locatario_data JSONB DEFAULT '{}'::jsonb,
  conjuge_locatario_data JSONB DEFAULT '{}'::jsonb,
  fiador_data JSONB DEFAULT '{}'::jsonb,
  imovel_data JSONB DEFAULT '{}'::jsonb,
  complementary_data JSONB DEFAULT '{}'::jsonb,
  document_ids TEXT[] DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela docx_field_conflicts
CREATE TABLE IF NOT EXISTS public.docx_field_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contract_data_bank_id UUID,
  field_path TEXT NOT NULL,
  values JSONB DEFAULT '[]'::jsonb,
  resolved BOOLEAN DEFAULT false,
  selected_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela docx_contratos
CREATE TABLE IF NOT EXISTS public.docx_contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  broker_id UUID,
  conectaios_property_id UUID,
  locador_client_id UUID,
  locatario_client_id UUID,
  conectaios_client_id UUID,
  valor_aluguel NUMERIC NOT NULL,
  data_inicio DATE NOT NULL,
  prazo_meses INTEGER NOT NULL,
  vencimento_dia INTEGER DEFAULT 5,
  tipo_garantia TEXT DEFAULT 'caucao' CHECK (tipo_garantia IN ('caucao', 'fiador', 'seguro_fianca', 'nenhuma')),
  detalhes_garantia TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'rascunho',
  pdf_url TEXT,
  html_preview TEXT,
  contract_html TEXT,
  provider_document_id TEXT,
  signature_status TEXT DEFAULT 'pendente' CHECK (signature_status IN ('pendente', 'assinado', 'cancelado', 'expirado')),
  pdf_generated_url TEXT,
  clicksign_document_key TEXT,
  clicksign_envelope_id TEXT,
  clicksign_document_url TEXT,
  total_signatarios INTEGER DEFAULT 2,
  assinados_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela docx_contratos_signatarios
CREATE TABLE IF NOT EXISTS public.docx_contratos_signatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('locador', 'locatario', 'fiador', 'testemunha')),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'assinado', 'recusado')),
  assinado_em TIMESTAMPTZ,
  clicksign_signer_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela docx_contratos_eventos
CREATE TABLE IF NOT EXISTS public.docx_contratos_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabela docx_clientes
CREATE TABLE IF NOT EXISTS public.docx_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 2: CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_docx_client_documents_user_id ON public.docx_client_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_docx_client_documents_client_id ON public.docx_client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_docx_client_documents_client_type ON public.docx_client_documents(client_type);
CREATE INDEX IF NOT EXISTS idx_docx_contract_data_bank_user_id ON public.docx_contract_data_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_docx_field_conflicts_user_id ON public.docx_field_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_docx_field_conflicts_contract_id ON public.docx_field_conflicts(contract_data_bank_id);
CREATE INDEX IF NOT EXISTS idx_docx_contratos_user_id ON public.docx_contratos(user_id);
CREATE INDEX IF NOT EXISTS idx_docx_contratos_broker_id ON public.docx_contratos(broker_id);
CREATE INDEX IF NOT EXISTS idx_docx_contratos_status ON public.docx_contratos(status);
CREATE INDEX IF NOT EXISTS idx_docx_contratos_signatarios_contrato_id ON public.docx_contratos_signatarios(contrato_id);
CREATE INDEX IF NOT EXISTS idx_docx_contratos_eventos_contrato_id ON public.docx_contratos_eventos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_docx_clientes_user_id ON public.docx_clientes(user_id);

-- =====================================================
-- PARTE 3: HABILITAR RLS
-- =====================================================

ALTER TABLE public.docx_client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docx_contract_data_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docx_field_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docx_contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docx_contratos_signatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docx_contratos_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docx_clientes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 4: CRIAR POLICIES RLS
-- =====================================================

-- Policies para docx_client_documents
DROP POLICY IF EXISTS "Users manage own documents" ON public.docx_client_documents;
CREATE POLICY "Users manage own documents"
ON public.docx_client_documents
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies para docx_contract_data_bank
DROP POLICY IF EXISTS "Users manage own contract data" ON public.docx_contract_data_bank;
CREATE POLICY "Users manage own contract data"
ON public.docx_contract_data_bank
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies para docx_field_conflicts
DROP POLICY IF EXISTS "Users manage own conflicts" ON public.docx_field_conflicts;
CREATE POLICY "Users manage own conflicts"
ON public.docx_field_conflicts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies para docx_contratos
DROP POLICY IF EXISTS "Users manage own contratos" ON public.docx_contratos;
CREATE POLICY "Users manage own contratos"
ON public.docx_contratos
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies para docx_contratos_signatarios
DROP POLICY IF EXISTS "Users manage signatarios" ON public.docx_contratos_signatarios;
CREATE POLICY "Users manage signatarios"
ON public.docx_contratos_signatarios
FOR ALL TO authenticated
USING (
  contrato_id IN (
    SELECT id FROM docx_contratos WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  contrato_id IN (
    SELECT id FROM docx_contratos WHERE user_id = auth.uid()
  )
);

-- Policies para docx_contratos_eventos
DROP POLICY IF EXISTS "Users view own eventos" ON public.docx_contratos_eventos;
CREATE POLICY "Users view own eventos"
ON public.docx_contratos_eventos
FOR SELECT TO authenticated
USING (
  contrato_id IN (
    SELECT id FROM docx_contratos WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System inserts eventos" ON public.docx_contratos_eventos;
CREATE POLICY "System inserts eventos"
ON public.docx_contratos_eventos
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policies para docx_clientes
DROP POLICY IF EXISTS "Users manage own clientes" ON public.docx_clientes;
CREATE POLICY "Users manage own clientes"
ON public.docx_clientes
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PARTE 5: CRIAR TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_docx_client_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_docx_client_documents_updated_at ON public.docx_client_documents;
CREATE TRIGGER trigger_update_docx_client_documents_updated_at
BEFORE UPDATE ON public.docx_client_documents
FOR EACH ROW
EXECUTE FUNCTION update_docx_client_documents_updated_at();

DROP TRIGGER IF EXISTS trigger_update_docx_contract_data_bank_updated_at ON public.docx_contract_data_bank;
CREATE TRIGGER trigger_update_docx_contract_data_bank_updated_at
BEFORE UPDATE ON public.docx_contract_data_bank
FOR EACH ROW
EXECUTE FUNCTION update_docx_client_documents_updated_at();

DROP TRIGGER IF EXISTS trigger_update_docx_contratos_updated_at ON public.docx_contratos;
CREATE TRIGGER trigger_update_docx_contratos_updated_at
BEFORE UPDATE ON public.docx_contratos
FOR EACH ROW
EXECUTE FUNCTION update_docx_client_documents_updated_at();

-- =====================================================
-- PARTE 6: STORAGE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "docx_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "docx_select_public" ON storage.objects;
DROP POLICY IF EXISTS "docx_update_own" ON storage.objects;
DROP POLICY IF EXISTS "docx_delete_own" ON storage.objects;

CREATE POLICY "docx_upload_authenticated"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'docx-cliente-documentos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "docx_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'docx-cliente-documentos');

CREATE POLICY "docx_update_own"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'docx-cliente-documentos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "docx_delete_own"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'docx-cliente-documentos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- PARTE 7: FUNÇÕES DE INTEGRAÇÃO COM CONECTAIOS (READ-ONLY)
-- =====================================================

-- Função para buscar dados do corretor logado
CREATE OR REPLACE FUNCTION public.ctrt_buscar_corretor_conectaios()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', b.id,
    'nome', b.name,
    'cpf', b.cpf_cnpj,
    'creci', b.creci,
    'email', b.email,
    'telefone', b.phone,
    'endereco', b.address,
    'cidade', b.city,
    'uf', b.state,
    'cep', b.zipcode,
    'corretora_nome', NULL,
    'corretora_telefone', NULL,
    'corretora_pix', NULL,
    'logo_url', b.avatar_url
  ) INTO v_result
  FROM brokers b
  WHERE b.user_id = auth.uid();
  
  RETURN v_result;
END;
$$;

-- Função para buscar dados de um imóvel
CREATE OR REPLACE FUNCTION public.ctrt_buscar_imovel_conectaios(p_imovel_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', i.id,
    'tipo', i.type,
    'categoria', i.property_type,
    'endereco', i.street,
    'numero', i.number,
    'complemento', NULL,
    'bairro', i.neighborhood,
    'cidade', i.city,
    'uf', i.state,
    'cep', i.zipcode,
    'matricula', NULL,
    'cartorio', NULL,
    'cartorio_uf', NULL,
    'area_total', i.area_total,
    'area_construida', i.area_built,
    'quartos', i.bedrooms,
    'banheiros', i.bathrooms,
    'vagas_garagem', i.parking,
    'valor_aluguel', i.price,
    'iptu', i.iptu,
    'condominio', i.condo_fee,
    'imagens', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', img.id,
          'url', img.url,
          'ordem', img.position
        ) ORDER BY img.position
      )
      FROM imovel_images img
      WHERE img.imovel_id = i.id
    )
  ) INTO v_result
  FROM imoveis i
  WHERE i.id = p_imovel_id
    AND i.owner_id = auth.uid();
  
  RETURN v_result;
END;
$$;

-- Função para buscar dados de um cliente
CREATE OR REPLACE FUNCTION public.ctrt_buscar_cliente_conectaios(p_cliente_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'tipo_pessoa', 'fisica',
    'nome_completo', c.nome,
    'razao_social', NULL,
    'cpf', NULL,
    'cnpj', NULL,
    'rg', NULL,
    'rg_uf', NULL,
    'nacionalidade', NULL,
    'profissao', c.profissao,
    'estado_civil', c.estado_civil,
    'data_nascimento', NULL,
    'email', c.email,
    'telefone', c.telefone,
    'endereco', c.endereco,
    'numero', NULL,
    'complemento', NULL,
    'bairro', NULL,
    'cidade', c.cidade,
    'uf', c.estado,
    'cep', c.cep
  ) INTO v_result
  FROM clients c
  WHERE c.id = p_cliente_id
    AND c.user_id = auth.uid();
  
  RETURN v_result;
END;
$$;

-- Função para listar imóveis do corretor
CREATE OR REPLACE FUNCTION public.ctrt_listar_imoveis_conectaios()
RETURNS TABLE (
  id UUID,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  matricula TEXT,
  valor_aluguel NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    CONCAT(COALESCE(i.street, ''), ', ', COALESCE(i.number, 'S/N')) as endereco,
    i.neighborhood as bairro,
    i.city as cidade,
    i.state as uf,
    NULL::TEXT as matricula,
    i.price as valor_aluguel
  FROM imoveis i
  WHERE i.owner_id = auth.uid()
    AND i.purpose = 'locacao'
  ORDER BY i.created_at DESC;
END;
$$;

-- Função para listar clientes do corretor
CREATE OR REPLACE FUNCTION public.ctrt_listar_clientes_conectaios()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  cpf TEXT,
  cnpj TEXT,
  email TEXT,
  telefone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    NULL::TEXT as cpf,
    NULL::TEXT as cnpj,
    c.email,
    c.telefone
  FROM clients c
  WHERE c.user_id = auth.uid()
  ORDER BY c.created_at DESC;
END;
$$;