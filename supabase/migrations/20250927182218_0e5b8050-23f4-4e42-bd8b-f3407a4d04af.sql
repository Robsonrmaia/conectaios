-- Tabela (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS e leitura pública (se necessário)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='system_settings'
      AND policyname='system_settings_public_read'
  ) THEN
    CREATE POLICY system_settings_public_read
    ON public.system_settings FOR SELECT TO public USING (true);
  END IF;
END $$;

-- Upsert das chaves de branding
INSERT INTO public.system_settings (key, value) VALUES
('site_logo_url', jsonb_build_object('url','https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/Logo.png')),
('site_hero_url', jsonb_build_object('url','https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/iagohero.png'))
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();