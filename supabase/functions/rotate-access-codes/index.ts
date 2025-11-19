// @ts-ignore: Deno module - editor may complain but it works in Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting access code rotation process...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate new rotating access code
    const { data: newCode, error: generateError } = await supabase
      .rpc('generate_rotating_access_code')

    if (generateError) {
      console.error('Error generating new code:', generateError)
      throw generateError
    }

    console.log('New access code generated:', newCode)

    // Get all currently active codes for logging
    const { data: activeCodes, error: fetchError } = await supabase
      .from('rotating_access_codes')
      .select('code, expires_at, usage_count')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching active codes:', fetchError)
    } else {
      console.log('Currently active codes:', activeCodes)
    }

    return new Response(
      JSON.stringify({
        success: true,
        newCode: newCode,
        activeCodes: activeCodes?.length || 0,
        message: 'Access codes rotated successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in rotate-access-codes function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})