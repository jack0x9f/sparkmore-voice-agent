// @ts-ignore: Deno module - editor may complain but it works in Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve((req) => {
  console.log('🚀 Test function invoked!');  // This should show in logs
  return new Response(JSON.stringify({ message: 'Hello from test function!' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});