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
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1" fill="hsl(142 76% 36%)" className="animate-pulse-gentle" />
          </pattern>
        </defs>
        
        {/* Background grid pattern */}
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.1" />
        
        {/* Animated connecting lines */}
        <g stroke="hsl(142 76% 36%)" strokeWidth="1" fill="none" opacity="0.15">
          {/* Horizontal lines */}
          <path 
            d="M 100 150 Q 300 140 500 150 T 700 160" 
            className="animate-line-draw"
            style={{ animationDelay: '0s' }}
          />
          <path 
            d="M 50 250 Q 250 240 450 250 T 750 260" 
            className="animate-line-draw"
            style={{ animationDelay: '2s' }}
          />
          <path 
            d="M 120 350 Q 320 340 520 350 T 680 360" 
            className="animate-line-draw"
            style={{ animationDelay: '4s' }}
          />
          
          {/* Vertical connections */}
          <path 
            d="M 200 100 Q 190 200 200 300 T 210 500" 
            className="animate-line-draw"
            style={{ animationDelay: '1s' }}
          />
          <path 
            d="M 400 120 Q 390 220 400 320 T 410 480" 
            className="animate-line-draw"
            style={{ animationDelay: '3s' }}
          />
          <path 
            d="M 600 110 Q 590 210 600 310 T 610 490" 
            className="animate-line-draw"
            style={{ animationDelay: '5s' }}
          />
          
          {/* Diagonal connections */}
          <path 
            d="M 150 180 Q 300 250 450 320 T 650 420" 
            className="animate-line-draw"
            style={{ animationDelay: '1.5s' }}
          />
          <path 
            d="M 650 180 Q 500 250 350 320 T 150 420" 
            className="animate-line-draw"
            style={{ animationDelay: '3.5s' }}
          />
        </g>
        
        {/* Connection nodes */}
        <g fill="hsl(142 76% 36%)" opacity="0.2">
          <circle cx="200" cy="150" r="2" className="animate-pulse-gentle" style={{ animationDelay: '0.5s' }} />
          <circle cx="400" cy="250" r="2" className="animate-pulse-gentle" style={{ animationDelay: '1.5s' }} />
          <circle cx="600" cy="350" r="2" className="animate-pulse-gentle" style={{ animationDelay: '2.5s' }} />
          <circle cx="300" cy="200" r="1.5" className="animate-pulse-gentle" style={{ animationDelay: '3s' }} />
          <circle cx="500" cy="300" r="1.5" className="animate-pulse-gentle" style={{ animationDelay: '4s' }} />
        </g>
      </svg>
    </div>
  );
}