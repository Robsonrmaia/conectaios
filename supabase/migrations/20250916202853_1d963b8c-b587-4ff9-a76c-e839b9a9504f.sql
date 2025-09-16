-- Desabilitar construction mode para resolver o problema de loading infinito
UPDATE system_settings 
SET value = jsonb_set(value, '{enabled}', 'false'::jsonb), updated_at = now()
WHERE key = 'construction_mode';