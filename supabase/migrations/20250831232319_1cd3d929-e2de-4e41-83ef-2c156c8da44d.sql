-- Inserir dados de exemplo para o CRM

-- Inserir pipeline padrão se não existir
INSERT INTO conectaios_pipelines (id, user_id, name, stages, is_default)
SELECT 
  gen_random_uuid(),
  auth.uid(),
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
WHERE NOT EXISTS (
  SELECT 1 FROM conectaios_pipelines WHERE name = 'Pipeline Padrão'
);

-- Inserir clientes de exemplo
INSERT INTO conectaios_clients (id, user_id, nome, telefone, tipo, stage, classificacao, valor, created_at)
VALUES 
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Maria Silva', '(73) 99999-1234', 'comprador', 'novo_lead', 'quente', 850000, now() - interval '2 days'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'João Santos', '(73) 98888-5678', 'vendedor', 'contato_inicial', 'morno', 650000, now() - interval '1 day'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Ana Costa', '(73) 97777-9012', 'comprador', 'qualificacao', 'quente', 480000, now() - interval '3 hours'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Pedro Oliveira', '(73) 96666-3456', 'investidor', 'proposta', 'frio', 1200000, now() - interval '5 days'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Carla Mendes', '(73) 95555-7890', 'comprador', 'negociacao', 'quente', 750000, now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Inserir tarefas de exemplo
INSERT INTO conectaios_tasks (id, user_id, txt, quando, onde, quem, porque, done, created_at)
VALUES 
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Ligar para Maria Silva', 'Hoje 14:00', 'Escritório', 'Maria Silva', 'Agendar visita ao apartamento', false, now()),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Enviar documentos', 'Amanhã 09:00', 'Email', 'João Santos', 'Finalizar proposta de venda', false, now() - interval '1 hour'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Visita ao imóvel', 'Sexta 15:30', 'Rua das Flores, 123', 'Ana Costa', 'Mostrar apartamento de 2 quartos', true, now() - interval '2 days'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), 'Reunião com cliente', 'Segunda 10:00', 'Café Central', 'Pedro Oliveira', 'Discutir investimento em imóveis', false, now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Inserir notas de exemplo
INSERT INTO conectaios_notes (id, user_id, client_id, content, created_at)
VALUES 
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), (SELECT id FROM conectaios_clients WHERE nome = 'Maria Silva' LIMIT 1), 'Cliente muito interessada em apartamentos na região do centro. Orçamento até R$ 850.000. Prefere imóveis com 3 quartos e garagem.', now() - interval '1 day'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), (SELECT id FROM conectaios_clients WHERE nome = 'João Santos' LIMIT 1), 'Proprietário quer vender urgente por mudança de cidade. Imóvel bem conservado, aceita negociação.', now() - interval '2 hours'),
  (gen_random_uuid(), (SELECT user_id FROM conectaios_brokers LIMIT 1), (SELECT id FROM conectaios_clients WHERE nome = 'Ana Costa' LIMIT 1), 'Primeira compradora, precisa de financiamento. Já pré-aprovada no banco. Quer imóvel para morar com família.', now() - interval '30 minutes')
ON CONFLICT (id) DO NOTHING;