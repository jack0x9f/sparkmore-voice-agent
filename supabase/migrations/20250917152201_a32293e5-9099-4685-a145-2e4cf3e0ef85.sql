-- Move extensions to proper schemas for security
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate extensions in the extensions schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Re-schedule the cron job using the extension in the proper schema
SELECT extensions.cron.schedule(
  'rotate-access-codes-weekly',
  '0 0 */7 * *', -- Every 7 days at midnight
  $$
  SELECT
    extensions.http_post(
        url:='https://aoohychgkqyudrqapyss.supabase.co/functions/v1/rotate-access-codes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb2h5Y2hna3F5dWRycWFweXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTE1MzUsImV4cCI6MjA3MzY4NzUzNX0.o9MwzIFBoRPhqryO-6sd-ARqtdTUuPLJgiCeXucdaw4"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);