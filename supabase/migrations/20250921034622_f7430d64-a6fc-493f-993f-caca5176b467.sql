-- Inserir threads de teste
INSERT INTO threads (participants, title, created_by, type) VALUES 
(ARRAY['97857630-8aa7-4eee-a330-fc3e355dd174', '6970c9da-0fcf-43fe-ab1f-932d779458c1']::uuid[], 'Conversa sobre Imóvel Centro', '97857630-8aa7-4eee-a330-fc3e355dd174'::uuid, 'general'),
(ARRAY['97857630-8aa7-4eee-a330-fc3e355dd174', '550e8400-e29b-41d4-a716-446655440001']::uuid[], 'Negócio Apartamento Copacabana', '97857630-8aa7-4eee-a330-fc3e355dd174'::uuid, 'deal')
ON CONFLICT DO NOTHING;

-- Inserir mensagens de teste
INSERT INTO messages (thread_id, user_id, content, sender_name) 
SELECT 
  t.id,
  '118c5166-0430-4c27-a04d-1775a5d83acd'::uuid,
  'Olá! Como você está?',
  'João Silva'
FROM threads t 
WHERE t.title = 'Conversa sobre Imóvel Centro'
ON CONFLICT DO NOTHING;

INSERT INTO messages (thread_id, user_id, content, sender_name) 
SELECT 
  t.id,
  '118c5166-0430-4c27-a04d-1775a5d83acd'::uuid,
  'Vamos discutir os detalhes do negócio',
  'Maria Santos'
FROM threads t 
WHERE t.title = 'Negócio Apartamento Copacabana'
ON CONFLICT DO NOTHING;