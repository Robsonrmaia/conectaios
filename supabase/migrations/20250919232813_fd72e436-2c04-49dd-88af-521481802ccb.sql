-- Criar tabela de indicações
CREATE TABLE public.indications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_indicador UUID NOT NULL, -- referência ao corretor que indicou
  id_indicado UUID NOT NULL,  -- referência ao corretor indicado
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  mes_recompensa INTEGER, -- mês onde será aplicada a recompensa (formato YYYYMM)
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_confirmacao TIMESTAMP WITH TIME ZONE,
  codigo_indicacao TEXT NOT NULL, -- código usado na indicação
  desconto_aplicado NUMERIC DEFAULT 0, -- valor do desconto aplicado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_indications_indicador ON public.indications(id_indicador);
CREATE INDEX idx_indications_indicado ON public.indications(id_indicado);
CREATE INDEX idx_indications_status ON public.indications(status);
CREATE INDEX idx_indications_mes_recompensa ON public.indications(mes_recompensa);
CREATE INDEX idx_indications_codigo ON public.indications(codigo_indicacao);

-- Constraint única para evitar indicação duplicada do mesmo usuário
CREATE UNIQUE INDEX idx_indications_unique_indicado ON public.indications(id_indicado) 
WHERE status IN ('pendente', 'confirmado');

-- Trigger para updated_at
CREATE TRIGGER update_indications_updated_at
  BEFORE UPDATE ON public.indications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para histórico de descontos aplicados
CREATE TABLE public.indication_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL, -- corretor que recebeu o desconto
  mes_aplicacao INTEGER NOT NULL, -- mês da aplicação (formato YYYYMM)
  tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('indicador_50', 'indicado_50', 'zeramento_100')),
  valor_original NUMERIC NOT NULL,
  valor_desconto NUMERIC NOT NULL,
  valor_final NUMERIC NOT NULL,
  indicacoes_relacionadas UUID[] DEFAULT '{}', -- IDs das indicações que geraram o desconto
  aplicado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para descontos
CREATE INDEX idx_indication_discounts_broker ON public.indication_discounts(broker_id);
CREATE INDEX idx_indication_discounts_mes ON public.indication_discounts(mes_aplicacao);

-- Tabela para métricas do programa de indicações
CREATE TABLE public.indication_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_referencia INTEGER NOT NULL, -- mês de referência (formato YYYYMM)
  total_indicacoes INTEGER DEFAULT 0,
  indicacoes_confirmadas INTEGER DEFAULT 0,
  taxa_conversao NUMERIC DEFAULT 0,
  receita_impactada NUMERIC DEFAULT 0,
  desconto_total_aplicado NUMERIC DEFAULT 0,
  top_indicador_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único por mês
CREATE UNIQUE INDEX idx_indication_metrics_mes ON public.indication_metrics(mes_referencia);

-- Trigger para updated_at
CREATE TRIGGER update_indication_metrics_updated_at
  BEFORE UPDATE ON public.indication_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para indications
ALTER TABLE public.indications ENABLE ROW LEVEL SECURITY;

-- Corretores podem ver suas próprias indicações (como indicador ou indicado)
CREATE POLICY "Brokers can view their own indications" 
ON public.indications 
FOR SELECT 
USING (
  id_indicador IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
  OR id_indicado IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
);

-- Apenas sistema pode inserir indicações (via edge function)
CREATE POLICY "System can insert indications" 
ON public.indications 
FOR INSERT 
WITH CHECK (true);

-- Admins podem ver e gerenciar todas as indicações
CREATE POLICY "Admins can manage all indications" 
ON public.indications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies para indication_discounts
ALTER TABLE public.indication_discounts ENABLE ROW LEVEL SECURITY;

-- Corretores podem ver seus próprios descontos
CREATE POLICY "Brokers can view their own discounts" 
ON public.indication_discounts 
FOR SELECT 
USING (
  broker_id IN (SELECT id FROM conectaios_brokers WHERE user_id = auth.uid())
);

-- Sistema pode inserir descontos
CREATE POLICY "System can insert discounts" 
ON public.indication_discounts 
FOR INSERT 
WITH CHECK (true);

-- Admins podem ver todos os descontos
CREATE POLICY "Admins can view all discounts" 
ON public.indication_discounts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies para indication_metrics
ALTER TABLE public.indication_metrics ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ver métricas
CREATE POLICY "Authenticated users can view metrics" 
ON public.indication_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Apenas admins podem gerenciar métricas
CREATE POLICY "Admins can manage metrics" 
ON public.indication_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Função para processar indicações e aplicar descontos
CREATE OR REPLACE FUNCTION public.process_monthly_indication_rewards(target_month INTEGER DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month INTEGER;
  indication_record RECORD;
  broker_indications INTEGER;
  discount_type TEXT;
  plan_value NUMERIC;
  discount_amount NUMERIC;
  final_amount NUMERIC;
BEGIN
  -- Define o mês a ser processado (atual se não especificado)
  IF target_month IS NULL THEN
    current_month := TO_CHAR(NOW(), 'YYYYMM')::INTEGER;
  ELSE
    current_month := target_month;
  END IF;

  -- Processar indicações confirmadas no mês anterior
  FOR indication_record IN 
    SELECT 
      i.id_indicador,
      i.id_indicado,
      i.id,
      COUNT(*) OVER (PARTITION BY i.id_indicador) as total_indicacoes_broker
    FROM indications i
    WHERE i.status = 'confirmado' 
    AND i.mes_recompensa = current_month
    AND NOT EXISTS (
      SELECT 1 FROM indication_discounts id2 
      WHERE id2.broker_id = i.id_indicador 
      AND id2.mes_aplicacao = current_month
      AND i.id = ANY(id2.indicacoes_relacionadas)
    )
  LOOP
    -- Buscar valor do plano do corretor indicador
    SELECT cp.monthly_price INTO plan_value
    FROM conectaios_brokers cb
    JOIN conectaios_plans cp ON cb.plan_id = cp.id
    WHERE cb.id = indication_record.id_indicador;
    
    IF plan_value IS NULL THEN
      plan_value := 97.00; -- valor padrão
    END IF;

    -- Determinar tipo de desconto baseado no número de indicações
    IF indication_record.total_indicacoes_broker >= 2 THEN
      discount_type := 'zeramento_100';
      discount_amount := plan_value;
      final_amount := 0;
    ELSE
      discount_type := 'indicador_50';
      discount_amount := plan_value * 0.5;
      final_amount := plan_value - discount_amount;
    END IF;

    -- Registrar desconto para o indicador
    INSERT INTO indication_discounts (
      broker_id,
      mes_aplicacao,
      tipo_desconto,
      valor_original,
      valor_desconto,
      valor_final,
      indicacoes_relacionadas
    ) VALUES (
      indication_record.id_indicador,
      current_month,
      discount_type,
      plan_value,
      discount_amount,
      final_amount,
      ARRAY[indication_record.id]
    );

    -- Atualizar a indicação como processada
    UPDATE indications 
    SET desconto_aplicado = discount_amount,
        updated_at = NOW()
    WHERE id = indication_record.id;
  END LOOP;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'month_processed', current_month,
    'message', 'Recompensas processadas com sucesso'
  );
END;
$$;

-- Função para calcular desconto na primeira mensalidade do indicado
CREATE OR REPLACE FUNCTION public.calculate_first_month_discount(broker_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_value NUMERIC;
  discount_amount NUMERIC;
BEGIN
  -- Verificar se o broker foi indicado
  IF NOT EXISTS (
    SELECT 1 FROM indications 
    WHERE id_indicado = broker_id 
    AND status IN ('pendente', 'confirmado')
  ) THEN
    RETURN 0;
  END IF;

  -- Buscar valor do plano
  SELECT cp.monthly_price INTO plan_value
  FROM conectaios_brokers cb
  JOIN conectaios_plans cp ON cb.plan_id = cp.id
  WHERE cb.id = broker_id;
  
  IF plan_value IS NULL THEN
    plan_value := 97.00; -- valor padrão
  END IF;

  -- Calcular desconto de 50%
  discount_amount := plan_value * 0.5;
  
  -- Registrar desconto do indicado
  INSERT INTO indication_discounts (
    broker_id,
    mes_aplicacao,
    tipo_desconto,
    valor_original,
    valor_desconto,
    valor_final,
    indicacoes_relacionadas
  ) VALUES (
    broker_id,
    TO_CHAR(NOW(), 'YYYYMM')::INTEGER,
    'indicado_50',
    plan_value,
    discount_amount,
    plan_value - discount_amount,
    (SELECT ARRAY[id] FROM indications WHERE id_indicado = broker_id AND status IN ('pendente', 'confirmado') LIMIT 1)
  );

  RETURN discount_amount;
END;
$$;