-- 0) (opcional) ver se há duplicatas por user_id
SELECT user_id, COUNT(*) 
FROM public.brokers 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 1) (opcional) se houver duplicatas, mantém a mais recente e remove o resto
WITH ranked AS (
  SELECT id, user_id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) AS rn
  FROM public.brokers
)
DELETE FROM public.brokers b
USING ranked r
WHERE r.id = b.id AND r.rn > 1;

-- 2) garantir a coluna e a UNIQUE necessária ao upsert
ALTER TABLE public.brokers
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'brokers_user_id_key' 
      AND conrelid = 'public.brokers'::regclass
  ) THEN
    ALTER TABLE public.brokers
      ADD CONSTRAINT brokers_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3) (re)garantir a RLS do dono (não muda nada fora do Perfil)
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='brokers' AND policyname='brokers_owner_rw'
  ) THEN
    CREATE POLICY brokers_owner_rw
      ON public.brokers FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;