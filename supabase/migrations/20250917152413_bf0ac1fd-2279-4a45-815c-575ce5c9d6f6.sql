-- Ripristino le estensioni nello schema public (è normale per pg_cron e pg_net)
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule il cron job con sintassi corretta
SELECT cron.schedule(
  'rotate-access-codes-weekly',
  '0 0 */7 * *',
  'SELECT net.http_post(url:=''https://aoohychgkqyudrqapyss.supabase.co/functions/v1/rotate-access-codes'', headers:=''{"Content-Type": "application/json"}'', body:=''{"trigger": "cron"}'');'
);