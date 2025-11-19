import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import demoBackground from '@/assets/demo-background.png';

const Demo = () => {
  const [isAgentActive, setIsAgentActive] = useState(false);
  const navigate = useNavigate();
  
  const handleAIClick = () => {
    setIsAgentActive(true);
    // Navigate to voice agent page
    navigate('/voice-agent');
  };

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{
          backgroundImage: `url(${demoBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} 
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <Button
            onClick={handleBackClick}
            className="text-white bg-white/10 hover:bg-white/20 border border-white/20"
            variant="outline"
          >
            ← Back
          </Button>
        </div>
        
        <div className="text-center space-y-8 max-w-4xl">
          {/* AI Button */}
          <Button
            onClick={handleAIClick}
            className="w-32 h-32 rounded-full bg-particle-green/20 hover:bg-particle-green/30 border-2 border-particle-green text-particle-green font-semibold text-lg transition-all duration-300 hover:scale-105"
            variant="ghost"
          >
            AI
          </Button>
        </div>
      </div>
      
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-1 h-1 bg-particle-green rounded-full opacity-30 animate-pulse" 
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }} 
          />
        ))}
      </div>
    </div>
  );
};

export default Demo;