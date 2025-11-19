import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ofiioxsdxmzncimmshnj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maWlveHNkeG16bmNpbW1zaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODEyNzAsImV4cCI6MjA3NDY1NzI3MH0.zrYtL_HognblG3sbp063jd0p_A_4g5mKDVKzNQj5mEc';

const AIAgentTest = () => {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Voice recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
    error: voiceError
  } = useVoiceRecognition();

  // Text-to-speech hook
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported
  } = useTextToSpeech();

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setUserInput(transcript);
    }
  }, [transcript]);

  const handleRunAgent = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      console.log('🔑 SUPABASE_URL:', SUPABASE_URL);
      console.log('🔑 SUPABASE_ANON_KEY (first 20 chars):', SUPABASE_ANON_KEY);
      
      const payload = {
        user_input: userInput,
        session_id: crypto.randomUUID(),
        context: {
          channel: 'web',
          locale: 'en-US'
        }
      };

      // Call Supabase Edge Function
      const res = await window.fetch(`${SUPABASE_URL}/functions/v1/ai-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
      });

      if (!res.ok) {
        console.log("res", res);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);

      // Auto-speak the response if enabled
      if (autoSpeak && data && data.detail) {
        const textToSpeak = `${data.action_taken || 'Action completed'}. ${data.detail}`;
        speak(textToSpeak);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run agent');
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleAutoSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setAutoSpeak(!autoSpeak);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-between">
              <span>🧪 AI Agent Test Interface</span>
              <div className="flex items-center gap-2">
                {voiceSupported && (
                  <Button
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleVoiceInput}
                    disabled={loading}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Voice
                      </>
                    )}
                  </Button>
                )}
                {ttsSupported && (
                  <Button
                    variant={autoSpeak ? "default" : "outline"}
                    size="sm"
                    onClick={toggleAutoSpeak}
                    disabled={loading}
                    title={autoSpeak ? "Disable voice output" : "Enable voice output"}
                  >
                    {autoSpeak ? (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        {isSpeaking ? 'Speaking...' : 'Audio On'}
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4 mr-2" />
                        Audio Off
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Voice recognition status */}
            {voiceError && (
              <Alert variant="destructive">
                <AlertDescription>{voiceError}</AlertDescription>
              </Alert>
            )}
            
            {isListening && (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Mic className="w-4 h-4 animate-pulse" />
                  Listening... Speak now!
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                User Input {voiceSupported && "(Type or use voice)"}
              </label>
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Send a test email to test@example.com"
                className="min-h-[100px] font-mono"
                disabled={loading || isListening}
              />
            </div>

            <Button
              onClick={handleRunAgent}
              disabled={loading || !userInput.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Agent...
                </>
              ) : (
                'Run Agent'
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {response && (
              <Card className="bg-muted">
                <CardHeader>
                  <CardTitle className="text-lg">Agent Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Example Payloads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📝 Example Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setUserInput('Send a test email to test@example.com')}
              className="w-full justify-start"
            >
              Email Example
            </Button>
            <Button
              variant="outline"
              onClick={() => setUserInput('Send WhatsApp message to +1234567890 saying Hello')}
              className="w-full justify-start"
            >
              WhatsApp Example
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAgentTest;