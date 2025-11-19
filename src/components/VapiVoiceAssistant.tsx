import React, { useEffect, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Phone, PhoneOff, Mic, Volume2, Loader2 } from 'lucide-react';

interface VapiVoiceAssistantProps {
  assistantId?: string;
  publicKey?: string;
  onActionRequest?: (action: string, data: any) => Promise<any>;
}

const VapiVoiceAssistant: React.FC<VapiVoiceAssistantProps> = ({
  assistantId,
  publicKey,
  onActionRequest
}) => {
  const [vapi, setVapi] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [typedMessage, setTypedMessage] = useState<string>('');

  useEffect(() => {
    // Initialize Vapi
    const vapiInstance = new Vapi(publicKey || '');
    setVapi(vapiInstance);

    // Set up event listeners
    vapiInstance.on('call-start', () => {
      console.log('Call started');
      setIsCallActive(true);
      setIsConnecting(false);
    });

    vapiInstance.on('call-end', () => {
      console.log('Call ended');
      setIsCallActive(false);
      setIsSpeaking(false);
      setIsConnecting(false);
    });

    vapiInstance.on('speech-start', () => {
      console.log('Assistant started speaking');
      setIsSpeaking(true);
      // If assistant is speaking, call must be active
      setIsCallActive(true);
      setIsConnecting(false);
    });

    vapiInstance.on('speech-end', () => {
      console.log('Assistant stopped speaking');
      setIsSpeaking(false);
    });

    vapiInstance.on('message', (message: any) => {
      console.log('📨 Vapi message received:', message.type, message);
      
      // Debug: Log ALL message types to see what we're getting
      if (message.type === 'tool-calls') {
        console.log('🎉🎉🎉 TOOL CALL DETECTED! 🎉🎉🎉');
      } else {
        console.log('⚠️ Not a tool call, just:', message.type);
      }
      
      // Debug: Log conversation updates to see if function calls are happening
      if (message.type === 'conversation-update' && message.messages) {
        const lastMessages = message.messages.slice(-5);
        const hasFunctionCall = lastMessages.some((m: any) => m.role === 'function_call' || m.type === 'function_call');
        if (hasFunctionCall) {
          console.log('🔍 Function call detected in conversation!', lastMessages);
        }
      }
      
      if (message.type === 'transcript') {
        const text = message.transcriptType === 'final' ? message.transcript : '';
        if (text) {
          setTranscript(prev => [...prev, `${message.role}: ${text}`]);
        }
        // If we're getting transcripts, call must be active
        setIsCallActive(true);
        setIsConnecting(false);
      }

      // Handle function calls (actions)
      if (message.type === 'tool-calls') {
        console.log('🎯 Tool calls detected by Vapi!', message.toolCalls);
        handleFunctionCall(message);
      }
    });

    vapiInstance.on('error', (error: any) => {
      console.error('🚨 Vapi error:', error);
      
      // Try to extract detailed error message
      let detailedError = 'An error occurred';
      if (error?.error?.data?.error?.message) {
        const messages = error.error.data.error.message;
        detailedError = Array.isArray(messages) ? messages.join(', ') : messages;
      } else if (error?.message) {
        detailedError = error.message;
      }
      
      console.error('🚨 Detailed error:', detailedError);
      setError(detailedError);
      setIsConnecting(false);
    });

    return () => {
      vapiInstance.stop();
    };
  }, [publicKey]);

  const handleFunctionCall = async (message: any) => {
    console.log('Tool call message:', message);
    
    if (onActionRequest && message.toolCalls && message.toolCalls.length > 0) {
      // Get the first tool call
      const toolCall = message.toolCalls[0];
      const functionName = toolCall.function.name;
      
      // Parse arguments (they come as a JSON string)
      let parameters = {};
      try {
        parameters = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch (e) {
        console.error('Error parsing function arguments:', e);
        parameters = {};
      }
      
      console.log('📞 Calling function:', functionName, 'with params:', parameters);
      
      try {
        const result = await onActionRequest(functionName, parameters);
        
        console.log('✅ Function result:', result);
        
        // Send result back to Vapi
        if (vapi) {
          vapi.send({
            type: 'tool-call-result',
            toolCallId: toolCall.id,
            result: result
          });
        }
      } catch (error: any) {
        console.error('❌ Error handling function call:', error);
        
        // Send error back to Vapi
        if (vapi) {
          vapi.send({
            type: 'tool-call-result',
            toolCallId: toolCall.id,
            result: error.message || 'Function call failed'
          });
        }
      }
    }
  };

  const startCall = async () => {
    if (!vapi) return;

    setIsConnecting(true);
    setError('');
    setTranscript([]);

    try {
      if (assistantId) {
        // Use existing assistant
        console.log('🔧 Using pre-configured assistant:', assistantId);
        await vapi.start(assistantId);
      } else {
        console.log('✨ Creating inline assistant with functions');
        // Create inline assistant
        const assistantConfig = {
          model: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [
              {
              role: 'system',
              content: `You are an AI assistant that sends emails and WhatsApp messages.

CRITICAL: You MUST use the send_email and send_whatsapp functions. DO NOT pretend to send.

Process:
1. Collect: recipient, subject (optional), message
2. Confirm with user
3. When user says "yes" → IMMEDIATELY CALL THE FUNCTION
4. Wait for function result, then tell user

You can accept typed messages with "[User typed this message]: ..." - use that exact text.

Be brief and friendly.`
              }
            ],
            temperature: 0.3
          },
          voice: {
            provider: 'openai',
            voiceId: 'alloy'
          },
          firstMessage: "Hi! I'm your Sparkmore AI assistant. How can I help you today? I can send emails or WhatsApp messages for you.",
          functions: [
            {
              name: 'send_email',
              description: 'REQUIRED: Call this function immediately when user confirms to send an email. This actually sends the email via backend.',
              parameters: {
                type: 'object',
                properties: {
                  to: {
                    type: 'string',
                    description: 'Email address of the recipient'
                  },
                  subject: {
                    type: 'string',
                    description: 'Email subject line (use empty string if not provided)'
                  },
                  body: {
                    type: 'string',
                    description: 'Email message content'
                  }
                },
                required: ['to', 'body']
              }
            },
            {
              name: 'send_whatsapp',
              description: 'REQUIRED: Call this function immediately when user confirms to send WhatsApp. This actually sends the message via backend.',
              parameters: {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    description: 'Phone number with country code (e.g., +1234567890)'
                  },
                  message: {
                    type: 'string',
                    description: 'WhatsApp message content'
                  }
                },
                required: ['phone', 'message']
              }
            }
          ]
        };
        
        console.log('📋 Starting Vapi with config:', JSON.stringify(assistantConfig, null, 2));
        await vapi.start(assistantConfig);
      }
    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err.message || 'Failed to start call');
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  const sendTypedMessage = () => {
    if (!typedMessage.trim() || !isCallActive) return;
    
    // Add to transcript
    setTranscript(prev => [...prev, `💬 You (typed): ${typedMessage}`]);
    
    // Send message to Vapi so AI can "hear" it
    if (vapi) {
      vapi.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: `[User typed this message]: ${typedMessage}`
        }
      });
    }
    
    setTypedMessage('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Voice AI Assistant
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <Volume2 className="w-4 h-4 animate-pulse" />
              Speaking...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center gap-4">
          {!isCallActive && !isConnecting ? (
            <Button
              onClick={startCall}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Phone className="w-5 h-5 mr-2" />
              Start Voice Call
            </Button>
          ) : isConnecting ? (
            <Button
              disabled
              size="lg"
              className="w-full sm:w-auto"
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting...
            </Button>
          ) : (
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
              className="w-full sm:w-auto"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          )}

          {isCallActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mic className="w-4 h-4 animate-pulse text-green-500" />
              Call in progress - speak naturally
            </div>
          )}
        </div>

        {/* Type-while-talking feature */}
        {isCallActive && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTypedMessage()}
                placeholder="Optional: Type email/phone if needed..."
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
              <Button
                onClick={sendTypedMessage}
                disabled={!typedMessage.trim()}
                size="sm"
                variant="outline"
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Having trouble with spelling? Type specific info above and say "I typed it"
            </p>
          </div>
        )}

        {transcript.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Conversation:</h3>
            <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {transcript.map((text, index) => (
                <div
                  key={index}
                  className={`text-sm ${
                    text.startsWith('user:')
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>💡 Try saying:</p>
          <p>"Send an email to john@example.com"</p>
          <p>"Send a WhatsApp message to +1234567890"</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VapiVoiceAssistant;

