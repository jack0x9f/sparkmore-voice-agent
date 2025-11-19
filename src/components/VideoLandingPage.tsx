import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import sparkmoreLogo from '@/assets/sparkmore-logo.svg';

const VideoLandingPage = () => {
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // Try to play with sound first
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If autoplay with sound fails, try muted autoplay
          video.muted = true;
          video.play().catch(() => {
            // If muted autoplay also fails, show play button
            setShowPlayButton(true);
            
          });
        });
      }
    };

    const handleError = () => {
      setVideoError(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.play();
      setShowPlayButton(false);
    }
  };

  if (videoError) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Sparkmore AI
          </h1>
          <p className="text-muted-foreground">
            Video could not be loaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/sparkmore-hero-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Text Overlays */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center z-10">
          {/* Sparkmore Logo - Above the video flow */}
          <div className="mt-16 md:mt-24 mb-8">
            <img 
              src={sparkmoreLogo} 
              alt="Sparkmore" 
              className="h-16 md:h-24 w-auto mx-auto filter brightness-0 invert"
              style={{
                filter: 'brightness(0) saturate(100%) invert(70%) sepia(52%) saturate(2967%) hue-rotate(134deg) brightness(101%) contrast(101%)'
              }}
            />
          </div>
          
          {/* Space for video content in the middle */}
          <div className="h-32 md:h-48"></div>
          
          {/* AI Agency and subtitle - Below the video flow */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-semibold text-foreground">
              AI Agency
            </h2>
            <p className="text-lg md:text-2xl text-particle-green font-light">
              We automate your business
            </p>
             <div className="mt-6 space-y-2">
               <p className="text-sm md:text-base text-foreground/70 font-light">
                 Want to talk with our AI Agents? Send us an email here:{" "}
                  <span className="text-sm md:text-lg text-foreground">
                    contact@sparkmore.ch
                  </span>
               </p>
              
               <div className="mt-8 pt-6 border-t border-foreground/10 space-y-4">
                 <a 
                   href="/demo-login"
                   className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 pointer-events-auto group"
                 >
                   <span className="w-2 h-2 rounded-full bg-particle-green animate-pulse"></span>
                   Demo Access
                   <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                     (invitation required)
                   </span>
                 </a>
               </div>
            </div>
          </div>
        </div>
      </div>

      {showPlayButton && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-20">
          <Button
            onClick={handlePlayClick}
            variant="ghost"
            size="lg"
            className="bg-background/20 hover:bg-background/30 backdrop-blur-sm border border-foreground/20 text-foreground hover:text-foreground/80 transition-all duration-300 pointer-events-auto"
          >
            <Play className="w-6 h-6 mr-2 fill-current" />
            Tap to Play
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoLandingPage;