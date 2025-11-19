import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Volume2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useNavigate } from 'react-router-dom';
import aiDemoInterface from '@/assets/ai-demo-interface.png';

const AIAgentDemo = () => {
  const [isAgentActive, setIsAgentActive] = useState(false);
  const navigate = useNavigate();

  // Voice recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported
  } = useVoiceRecognition();

  // Text-to-speech hook
  const {
    speak,
    isSupported: ttsSupported
  } = useTextToSpeech();

  const handleAIClick = () => {
    setIsAgentActive(true);
    console.log('AI Agent activated');
    
    if (ttsSupported) {
      speak('AI Agent Demo activated. You can now interact with me using voice commands.');
    }
    
    // Start listening after a short delay
    setTimeout(() => {
      if (voiceSupported) {
        startListening();
      }
    }, 2000);
  };

  // Listen for voice commands
  useEffect(() => {
    if (transcript && isAgentActive) {
      const command = transcript.toLowerCase();
      
      if (command.includes('test') || command.includes('demo') || command.includes('show')) {
        speak('Opening AI Agent test interface');
        setTimeout(() => {
          navigate('/ai-agent-test');
        }, 1000);
      }
    }
  }, [transcript, isAgentActive, speak, navigate]);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${aiDemoInterface})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center space-y-8 max-w-4xl">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-wide">
            AI Agency
          </h1>
          
          {/* Subtitle */}
          <p className="text-2xl md:text-4xl text-logo-blue font-light">
            We automate your business
          </p>
          
          {/* Contact */}
          <p className="text-lg md:text-xl text-white/70 font-light">
            contact@sparkmore.ch
          </p>
          
          {/* Demo Status */}
          {isAgentActive && (
            <div className="bg-particle-green/10 border border-particle-green/30 rounded-lg p-4 mt-8">
              <p className="text-particle-green font-medium flex items-center justify-center gap-2">
                🤖 AI Agent Demo Ready
                {isListening && <Mic className="w-4 h-4 animate-pulse" />}
              </p>
              <p className="text-white/70 text-sm mt-2">
                {isListening 
                  ? '🎤 Listening for voice commands... Say "test" or "demo" to continue'
                  : 'AI interface activated - ready for integration'}
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/ai-agent-test')}
                  className="text-white border-particle-green hover:bg-particle-green/20"
                >
                  Go to Test Interface
                </Button>
                {voiceSupported && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    className="text-white border-particle-green hover:bg-particle-green/20"
                  >
                    {isListening ? (
                      <>
                        <Mic className="w-4 h-4 mr-2 animate-pulse" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Voice
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* AI Button */}
          <div className="mt-12">
            <Button
              onClick={handleAIClick}
              className="bg-transparent border-2 border-particle-green text-particle-green hover:bg-particle-green hover:text-black font-bold text-2xl px-12 py-6 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-particle-green/30"
            >
              AI
            </Button>
          </div>
          
          {/* Demo Instructions */}
          <div className="mt-16 text-center">
            <p className="text-white/50 text-sm flex items-center justify-center gap-2">
              Click the AI button to activate the demo interface
              {voiceSupported && (
                <>
                  <Mic className="w-3 h-3" />
                  Voice commands available
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentDemo;