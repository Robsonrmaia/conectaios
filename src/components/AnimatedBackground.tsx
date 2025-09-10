import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="0.8" fill="hsl(142 76% 36%)" className="animate-pulse-gentle" />
          </pattern>
        </defs>
        
        {/* Background grid pattern */}
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.15" />
        
        {/* Animated connecting lines */}
        <g stroke="hsl(142 76% 36%)" strokeWidth="0.3" fill="none" opacity="0.25">
          {/* Top area horizontal lines */}
          <path 
            d="M 80 50 Q 280 45 480 50 T 720 55" 
            className="animate-line-draw"
            style={{ animationDelay: '0s' }}
          />
          <path 
            d="M 50 80 Q 250 75 450 80 T 750 85" 
            className="animate-line-draw"
            style={{ animationDelay: '1s' }}
          />
          <path 
            d="M 120 110 Q 320 105 520 110 T 680 115" 
            className="animate-line-draw"
            style={{ animationDelay: '2s' }}
          />
          <path 
            d="M 90 140 Q 290 135 490 140 T 710 145" 
            className="animate-line-draw"
            style={{ animationDelay: '3s' }}
          />
          
          {/* Middle area lines */}
          <path 
            d="M 60 180 Q 260 175 460 180 T 740 185" 
            className="animate-line-draw"
            style={{ animationDelay: '4s' }}
          />
          <path 
            d="M 130 220 Q 330 215 530 220 T 670 225" 
            className="animate-line-draw"
            style={{ animationDelay: '1.5s' }}
          />
          
          {/* Vertical connections - focusing on top area */}
          <path 
            d="M 180 30 Q 175 80 180 130 T 185 230" 
            className="animate-line-draw"
            style={{ animationDelay: '0.5s' }}
          />
          <path 
            d="M 350 40 Q 345 90 350 140 T 355 240" 
            className="animate-line-draw"
            style={{ animationDelay: '2.5s' }}
          />
          <path 
            d="M 520 35 Q 515 85 520 135 T 525 235" 
            className="animate-line-draw"
            style={{ animationDelay: '4.5s' }}
          />
          <path 
            d="M 650 45 Q 645 95 650 145 T 655 245" 
            className="animate-line-draw"
            style={{ animationDelay: '3.5s' }}
          />
          
          {/* Diagonal connections - more in top area */}
          <path 
            d="M 100 60 Q 250 90 400 120 T 600 180" 
            className="animate-line-draw"
            style={{ animationDelay: '1.2s' }}
          />
          <path 
            d="M 600 70 Q 450 100 300 130 T 100 190" 
            className="animate-line-draw"
            style={{ animationDelay: '3.2s' }}
          />
          <path 
            d="M 200 40 Q 350 80 500 120 T 700 200" 
            className="animate-line-draw"
            style={{ animationDelay: '2.8s' }}
          />
          <path 
            d="M 700 50 Q 550 90 400 130 T 200 210" 
            className="animate-line-draw"
            style={{ animationDelay: '4.8s' }}
          />
        </g>
        
        {/* Connection nodes - more concentrated in top area */}
        <g fill="hsl(142 76% 36%)" opacity="0.25">
          <circle cx="180" cy="80" r="1.5" className="animate-pulse-gentle" style={{ animationDelay: '0.5s' }} />
          <circle cx="350" cy="120" r="1.5" className="animate-pulse-gentle" style={{ animationDelay: '1.5s' }} />
          <circle cx="520" cy="100" r="1.5" className="animate-pulse-gentle" style={{ animationDelay: '2.5s' }} />
          <circle cx="280" cy="60" r="1" className="animate-pulse-gentle" style={{ animationDelay: '3s' }} />
          <circle cx="450" cy="90" r="1" className="animate-pulse-gentle" style={{ animationDelay: '4s' }} />
          <circle cx="620" cy="140" r="1" className="animate-pulse-gentle" style={{ animationDelay: '1.8s' }} />
          <circle cx="150" cy="110" r="1" className="animate-pulse-gentle" style={{ animationDelay: '3.8s' }} />
          <circle cx="680" cy="80" r="1.2" className="animate-pulse-gentle" style={{ animationDelay: '2.2s' }} />
        </g>
      </svg>
    </div>
  );
}