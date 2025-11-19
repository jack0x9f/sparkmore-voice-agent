import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import VapiVoiceAssistant from '@/components/VapiVoiceAssistant';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ofiioxsdxmzncimmshnj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || ''; // Get from environment

// Debug: Log the key (first 10 chars only for security)
console.log('🔑 VAPI_PUBLIC_KEY loaded:', VAPI_PUBLIC_KEY ? `${VAPI_PUBLIC_KEY.substring(0, 10)}...` : 'NOT FOUND');
console.log('🔑 Full env check:', import.meta.env.VITE_VAPI_PUBLIC_KEY);

const VoiceAgentDemo = () => {
  const [actionLog, setActionLog] = useState<any[]>([]);

  // Handle actions requested by the AI agent
  const handleActionRequest = async (actionName: string, parameters: any) => {
    console.log('🎯 Action requested:', actionName, parameters);
    console.log('🚀 handleActionRequest CALLED!');
    console.log('📝 Parameters:', JSON.stringify(parameters, null, 2));
    
    const logId = Date.now() + Math.random(); // Unique ID for this log entry
    const timestamp = new Date().toISOString();
    
    // Add processing log
    setActionLog(prev => [...prev, {
      id: logId,
      action: actionName,
      params: parameters,
      timestamp,
      status: 'processing'
    }]);

    try {
      let userInput = '';
      
      if (actionName === 'send_email') {
        userInput = `Send an email to ${parameters.to}${parameters.subject ? ` with subject "${parameters.subject}"` : ''} saying: ${parameters.body}`;
      } else if (actionName === 'send_whatsapp') {
        userInput = `Send WhatsApp message to ${parameters.phone} saying: ${parameters.message}`;
      }

      console.log('📤 Calling backend with:', userInput);
      console.log('🔗 Full URL:', `${SUPABASE_URL}/functions/v1/ai-agent`);
      console.log('🔑 Auth key present:', !!SUPABASE_ANON_KEY);

      // Call your existing AI Agent backend
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          user_input: userInput,
          session_id: crypto.randomUUID(),
          context: {
            channel: 'voice',
            locale: 'en-US',
            source: 'vapi'
          }
        }),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Backend result:', result);
      console.log('✅ Result detail:', result.detail);
      console.log('✅ Result action_taken:', result.action_taken);
      
      // Update log with result using the unique ID
      setActionLog(prev => prev.map(log => 
        log.id === logId
          ? { ...log, status: 'completed', result }
          : log
      ));

      // Return just the message string for Vapi
      const returnMessage = result.detail || 'Action completed successfully';
      console.log('↩️ Returning to Vapi:', returnMessage);
      return returnMessage;
    } catch (error: any) {
      console.error('❌ Error executing action:', error);
      
      // Update log with error using the unique ID
      setActionLog(prev => prev.map(log => 
        log.id === logId
          ? { ...log, status: 'failed', error: error.message }
          : log
      ));

      // Return error message string for Vapi
      throw new Error(error.message || 'Failed to execute action');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Sparkmore AI Voice Agent
          </h1>
          <p className="text-muted-foreground">
            Conversational AI that can send emails and WhatsApp messages through natural voice interaction
          </p>
        </div>

        {/* Voice Agent - No Configuration Needed */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Voice Assistant */}
          <div>
            {!VAPI_PUBLIC_KEY ? (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">⚠️ Vapi Key Not Found</h3>
                <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                  The VITE_VAPI_PUBLIC_KEY environment variable is not set.
                </p>
                <ol className="text-sm text-red-600 dark:text-red-400 list-decimal list-inside space-y-1">
                  <li>Add your Vapi public key to <code className="bg-red-100 dark:bg-red-900 px-1 rounded">.env.local</code></li>
                  <li>Restart the dev server: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">npm run dev</code></li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            ) : (
              <>
                <VapiVoiceAssistant
                  publicKey={VAPI_PUBLIC_KEY}
                  assistantId="f4cc2634-1115-4c13-b18e-9a1e81f1b5a2"
                  onActionRequest={(action, params) => {
                    console.log('🔔 VoiceAgentDemo received action:', action, params);
                    return handleActionRequest(action, params);
                  }}
                />
                <div className="mt-4 p-3 bg-muted rounded text-xs text-muted-foreground">
                  <strong>Debug Info:</strong><br/>
                  Vapi Key: {VAPI_PUBLIC_KEY.substring(0, 10)}...{VAPI_PUBLIC_KEY.substring(VAPI_PUBLIC_KEY.length - 4)}<br/>
                  Assistant: f4cc2634-1115-4c13-b18e-9a1e81f1b5a2
                </div>
              </>
            )}
          </div>

          {/* Action Log */}
          <Card>
            <CardHeader>
              <CardTitle>Action Log</CardTitle>
              <CardDescription>
                Real-time log of actions executed by the AI agent
              </CardDescription>
            </CardHeader>
              <CardContent>
                {actionLog.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No actions yet</p>
                    <p className="text-sm mt-2">
                      Start a voice call and ask the AI to send an email or WhatsApp message
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {actionLog.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          log.status === 'completed'
                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                            : log.status === 'failed'
                            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                            : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm capitalize text-gray-900 dark:text-white">
                              {log.action.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              log.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                                : log.status === 'failed'
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        
                        {/* Parameters Details */}
                        <div className="space-y-1 text-xs text-gray-900 dark:text-gray-100">
                          {log.action === 'send_email' && (
                            <>
                              <div><strong className="text-gray-700 dark:text-gray-300">To:</strong> <span className="text-gray-900 dark:text-white">{log.params.to || 'N/A'}</span></div>
                              <div><strong className="text-gray-700 dark:text-gray-300">Subject:</strong> <span className="text-gray-900 dark:text-white">{log.params.subject || '(no subject)'}</span></div>
                              <div><strong className="text-gray-700 dark:text-gray-300">Message:</strong> <span className="text-gray-900 dark:text-white">{log.params.body || 'N/A'}</span></div>
                            </>
                          )}
                          {log.action === 'send_whatsapp' && (
                            <>
                              <div><strong className="text-gray-700 dark:text-gray-300">Phone:</strong> <span className="text-gray-900 dark:text-white">{log.params.phone || 'N/A'}</span></div>
                              <div><strong className="text-gray-700 dark:text-gray-300">Message:</strong> <span className="text-gray-900 dark:text-white">{log.params.message || 'N/A'}</span></div>
                            </>
                          )}
                        </div>
                        
                        {/* Result Details */}
                        {log.result && (
                          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 text-xs">
                            <div className="font-semibold mb-1 text-gray-800 dark:text-gray-200">Result:</div>
                            <div className="text-green-700 dark:text-green-300 font-medium">
                              {typeof log.result === 'string' 
                                ? log.result 
                                : log.result.detail || log.result.message || JSON.stringify(log.result)}
                            </div>
                            {log.result.action_taken && (
                              <div className="mt-1 text-gray-700 dark:text-gray-300">
                                Action: <span className="font-medium">{log.result.action_taken}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Error Details */}
                        {log.error && (
                          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 text-xs">
                            <div className="font-semibold mb-1 text-red-700 dark:text-red-300">Error:</div>
                            <div className="text-red-600 dark:text-red-400 font-medium">
                              {log.error}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎤 Natural Conversation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Speak naturally with the AI. No need to use specific commands or phrases.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📧 Email & WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ask the AI to send emails or WhatsApp messages, and it will guide you through the process.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Real-time Actions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Actions are executed in real-time through your existing n8n workflows.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgentDemo;

