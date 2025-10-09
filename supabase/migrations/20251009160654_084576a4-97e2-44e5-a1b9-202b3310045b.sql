-- ====================================
-- CRON JOB: Auto-Suspensão de Assinaturas
-- ====================================
-- Executa diariamente às 03:00 UTC (00:00 Brasília)
-- Suspende brokers com pagamento atrasado há mais de 7 dias

-- Verificar se pg_cron extension está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar cron job para auto-suspensão
SELECT cron.schedule(
  'subscription-auto-suspend',
  '0 3 * * *', -- Todos os dias às 03:00 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/subscription-auto-suspend',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYXdvamtxcmdnbnV2cG5ud3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjcwMjIsImV4cCI6MjA3NDUwMzAyMn0.w6GWfIyEvcYDsG1W4J0yatSx-ueTm6_m7Qkj-GvxEIU"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Listar cron jobs existentes para verificação
SELECT * FROM cron.job WHERE jobname = 'subscription-auto-suspend';