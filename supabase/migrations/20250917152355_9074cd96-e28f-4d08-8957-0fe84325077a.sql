-- Fix the cron job schedule to use the correct extension paths
-- First remove the old schedule if it exists
SELECT cron.unschedule('rotate-access-codes-weekly');

-- Create the cron job with correct syntax
SELECT cron.schedule(
  'rotate-access-codes-weekly',
  '0 0 */7 * *', -- Every 7 days at midnight
  $$
  SELECT
    net.http_post(
        url:='https://aoohychgkqyudrqapyss.supabase.co/functions/v1/rotate-access-codes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb2h5Y2hna3F5dWRycWFweXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTE1MzUsImV4cCI6MjA3MzY4NzUzNX0.o9MwzIFBoRPhqryO-6sd-ARqtdTUuPLJgiCeXucdaw4"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);