-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly gamification reset for the 1st of each month at 1 AM (Bahia timezone)
-- This translates to 4 AM UTC (UTC-3 for Bahia)
SELECT cron.schedule(
  'monthly-gamification-reset',
  '0 4 1 * *', -- At 04:00 on day-of-month 1 (UTC)
  $$
  select
    net.http_post(
        url:='https://hvbdeyuqcliqrmzvyciq.supabase.co/functions/v1/monthly-gamification-reset',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YmRleXVxY2xpcXJtenZ5Y2lxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MDA0OCwiZXhwIjoyMDcwNDE2MDQ4fQ.I9nvBcHUiNqnKDj9GfrsLXG0zRKN4u5qOhS7BK_cKPA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Add system settings for gamification feature flags
INSERT INTO public.system_settings (key, value, description) VALUES
('gamification_enabled', 'true', 'Enable/disable gamification system'),
('gamification_rollout_phase', 'general', 'Rollout phase: beta, pilot, or general'),
('gamification_beta_brokers', '[]', 'Array of broker IDs in beta phase'),
('gamification_pilot_brokers', '[]', 'Array of broker IDs in pilot phase')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;