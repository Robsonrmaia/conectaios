-- Atualizar logos conforme solicitação do usuário
-- Logo do cabeçalho (header): https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/Logo.png
-- Logo de auth/carregamento: https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/logonova.png

-- Inserir/atualizar logo do cabeçalho
INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'site_header_logo_url',
  '{"url": "https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/Logo.png"}',
  now()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = '{"url": "https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/Logo.png"}',
  updated_at = now();

-- Inserir/atualizar logo de auth/carregamento
INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'site_logo_url',
  '{"url": "https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/logonova.png"}',
  now()
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = '{"url": "https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/logonova.png"}',
  updated_at = now();