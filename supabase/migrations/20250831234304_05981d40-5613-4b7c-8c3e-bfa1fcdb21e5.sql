-- Criar tabela conectaios_pipelines
CREATE TABLE conectaios_pipelines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE conectaios_pipelines ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own pipelines" 
ON conectaios_pipelines 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_conectaios_pipelines_updated_at
BEFORE UPDATE ON conectaios_pipelines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO conectaios_pipelines (user_id, name, stages, is_default)
SELECT 
  user_id,
  'Pipeline Padrão',
  '[
    {"id": "novo_lead", "name": "Novo Lead", "color": "blue"},
    {"id": "contato_inicial", "name": "Contato Inicial", "color": "yellow"},
    {"id": "qualificacao", "name": "Qualificação", "color": "orange"},
    {"id": "proposta", "name": "Proposta", "color": "purple"},
    {"id": "negociacao", "name": "Negociação", "color": "indigo"},
    {"id": "fechamento", "name": "Fechamento", "color": "green"}
  ]'::jsonb,
  true
FROM conectaios_brokers
WHERE NOT EXISTS (
  SELECT 1 FROM conectaios_pipelines WHERE name = 'Pipeline Padrão'
);

-- Inserir clientes de exemplo
INSERT INTO conectaios_clients (user_id, nome, telefone, tipo, stage, classificacao, valor, created_at)
SELECT 
  user_id,
  'Maria Silva',
  '(73) 99999-1234',
  'comprador',
  'novo_lead',
  'quente',
  850000,
  now() - interval '2 days'
FROM conectaios_brokers
WHERE NOT EXISTS (SELECT 1 FROM conectaios_clients WHERE nome = 'Maria Silva');

INSERT INTO conectaios_clients (user_id, nome, telefone, tipo, stage, classificacao, valor, created_at)
SELECT 
  user_id,
  'João Santos',
  '(73) 98888-5678',
  'vendedor',
  'contato_inicial',
  'morno',
  650000,
  now() - interval '1 day'
FROM conectaios_brokers
WHERE NOT EXISTS (SELECT 1 FROM conectaios_clients WHERE nome = 'João Santos');

INSERT INTO conectaios_clients (user_id, nome, telefone, tipo, stage, classificacao, valor, created_at)
SELECT 
  user_id,
  'Ana Costa',
  '(73) 97777-9012',
  'comprador',
  'qualificacao',
  'quente',
  480000,
  now() - interval '3 hours'
FROM conectaios_brokers
WHERE NOT EXISTS (SELECT 1 FROM conectaios_clients WHERE nome = 'Ana Costa');

-- Inserir tarefas de exemplo
INSERT INTO conectaios_tasks (user_id, txt, quando, onde, quem, porque, done, created_at)
SELECT 
  user_id,
  'Ligar para Maria Silva',
  'Hoje 14:00',
  'Escritório',
  'Maria Silva',
  'Agendar visita ao apartamento',
  false,
  now()
FROM conectaios_brokers
WHERE NOT EXISTS (SELECT 1 FROM conectaios_tasks WHERE txt = 'Ligar para Maria Silva');

INSERT INTO conectaios_tasks (user_id, txt, quando, onde, quem, porque, done, created_at)
SELECT 
  user_id,
  'Enviar documentos',
  'Amanhã 09:00',
  'Email',
  'João Santos',
  'Finalizar proposta de venda',
  false,
  now() - interval '1 hour'
FROM conectaios_brokers
WHERE NOT EXISTS (SELECT 1 FROM conectaios_tasks WHERE txt = 'Enviar documentos');