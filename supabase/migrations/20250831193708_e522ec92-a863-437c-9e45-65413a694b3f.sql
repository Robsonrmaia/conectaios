-- Limpar dados de teste do CRM que vieram de outro projeto
DELETE FROM clients WHERE user_id = '118c5166-0430-4c27-a04d-1775a5d83acd';
DELETE FROM tasks WHERE user_id = '118c5166-0430-4c27-a04d-1775a5d83acd';
DELETE FROM notes WHERE user_id = '118c5166-0430-4c27-a04d-1775a5d83acd';
DELETE FROM pipelines WHERE user_id = '118c5166-0430-4c27-a04d-1775a5d83acd';