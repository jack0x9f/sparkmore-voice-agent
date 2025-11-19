// @ts-ignore: Deno module - editor may complain but it works in Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}

interface AgentRequest {
  user_input: string;
  session_id: string;
  context: {
    channel: string;
    locale: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    console.log('🚀 AI Agent function invoked');
    const startTime = Date.now();
    const { user_input, session_id, context }: AgentRequest = await req.json();
    console.log('📥 Received input:', { user_input, session_id });

    // Check if secrets are loaded
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const n8nEmailWebhook = Deno.env.get('N8N_EMAIL_WEBHOOK');
    console.log('🔑 Secrets check:', {
      hasOpenAI: !!openaiKey,
      openaiKeyPrefix: openaiKey?.substring(0, 7) || 'MISSING',
      hasN8nEmail: !!n8nEmailWebhook
    });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Analyze user input with OpenAI
    console.log('🤖 Calling OpenAI...');
    const intentAnalysis = await analyzeIntent(user_input);
    console.log('✅ OpenAI response:', intentAnalysis);

    // Step 2: Route to appropriate action
    console.log('📤 Routing to action:', intentAnalysis.action);
    let result;
    switch (intentAnalysis.action) {
      case 'email.send':
        result = await handleEmailAction(user_input, intentAnalysis);
        break;
      case 'whatsapp.send':
        result = await handleWhatsAppAction(user_input, intentAnalysis);
        break;
      default:
        result = { detail: 'Action not supported' };
    }
    console.log('✅ Action result:', result);

    // Step 3: Log to Supabase
    console.log('💾 Saving to database...');
    await supabase.from('agent_logs').insert({
      session_id,
      user_input,
      action_taken: intentAnalysis.action,
      result,
      context
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Total duration: ${duration}ms`);

    return new Response(
      JSON.stringify({
        status: 'ok',
        action_taken: intentAnalysis.action,
        detail: result.detail,
        trace_id: `trace-${session_id.split('-')[0]}`,
        extras: {
          provider: result.provider,
          duration_ms: duration
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in AI Agent:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function analyzeIntent(userInput: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  console.log('🔑 OpenAI key check:', openaiApiKey ? `${openaiApiKey.substring(0, 7)}...` : 'MISSING');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI agent that analyzes user commands and returns JSON.
Possible actions: email.send, whatsapp.send, message.generate
Extract: action, recipient, message content.
Return only JSON: {"action": "email.send", "recipient": "email@example.com", "message": "content"}`
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      temperature: 0.3
    })
  });

  console.log('OpenAI response status:', response.status);
  const data = await response.json();
  console.log('OpenAI raw data:', JSON.stringify(data).substring(0, 200));
  
  if (!response.ok) {
    throw new Error(`OpenAI error: ${JSON.stringify(data)}`);
  }
  
  return JSON.parse(data.choices[0].message.content);
}

async function handleEmailAction(input: string, intent: any) {
  // Call n8n webhook for email
  const n8nWebhookUrl = Deno.env.get('N8N_EMAIL_WEBHOOK');
  console.log('n8nWebhookUrl: ', n8nWebhookUrl);
  
  const response = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: intent.recipient,
      subject: 'Test Email from AI Agent',
      body: intent.message || 'Test email triggered by AI Agent'
    })
  });

  return {
    detail: 'Email queued via n8n automation',
    provider: 'mailtrap'
  };
}

async function handleWhatsAppAction(input: string, intent: any) {
  // Call n8n webhook for WhatsApp
  const n8nWebhookUrl = Deno.env.get('N8N_WHATSAPP_WEBHOOK');
  
  const response = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: intent.recipient,
      message: intent.message
    })
  });

  return {
    detail: 'WhatsApp message queued via n8n',
    provider: 'twilio'
  };
}