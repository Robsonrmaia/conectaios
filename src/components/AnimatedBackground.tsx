import React from 'react';

export default function AnimatedBackground() {
  // Neural network nodes positioned more towards the top
  const nodes = [
    // Top layer - most concentrated
    { x: 150, y: 60, size: 2, delay: 0 },
    { x: 300, y: 40, size: 1.5, delay: 0.5 },
    { x: 450, y: 70, size: 2.5, delay: 1 },
    { x: 600, y: 50, size: 1.8, delay: 1.5 },
    { x: 750, y: 80, size: 2, delay: 2 },
    
    // Second layer
    { x: 100, y: 120, size: 1.5, delay: 0.3 },
    { x: 250, y: 100, size: 2, delay: 0.8 },
    { x: 400, y: 130, size: 1.8, delay: 1.3 },
    { x: 550, y: 110, size: 2.2, delay: 1.8 },
    { x: 700, y: 140, size: 1.5, delay: 2.3 },
    
    // Third layer
    { x: 180, y: 180, size: 1.8, delay: 0.6 },
    { x: 320, y: 160, size: 1.5, delay: 1.1 },
    { x: 480, y: 190, size: 2, delay: 1.6 },
    { x: 620, y: 170, size: 1.6, delay: 2.1 },
    
    // Fourth layer - sparser
    { x: 120, y: 240, size: 1.3, delay: 0.9 },
    { x: 380, y: 220, size: 1.8, delay: 1.4 },
    { x: 580, y: 250, size: 1.5, delay: 1.9 },
    
    // Bottom layer - very sparse
    { x: 200, y: 300, size: 1.2, delay: 1.2 },
    { x: 500, y: 280, size: 1.4, delay: 1.7 }
  ];

  // Connection lines between nearby nodes
  const connections = [
    // Top layer connections
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
    
    // Vertical connections from top to second layer
    { from: 0, to: 5 }, { from: 1, to: 6 }, { from: 2, to: 7 }, { from: 3, to: 8 }, { from: 4, to: 9 },
    
    // Second layer horizontal
    { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 8, to: 9 },
    
    // Second to third layer
    { from: 6, to: 10 }, { from: 7, to: 11 }, { from: 8, to: 12 }, { from: 9, to: 13 },
    
    // Third layer connections
    { from: 10, to: 11 }, { from: 11, to: 12 }, { from: 12, to: 13 },
    
    // Third to fourth layer
    { from: 10, to: 14 }, { from: 12, to: 15 }, { from: 13, to: 16 },
    
    // Fourth layer connections
    { from: 14, to: 15 }, { from: 15, to: 16 },
    
    // Fourth to bottom
    { from: 14, to: 17 }, { from: 16, to: 18 },
    
    // Some diagonal connections for complexity
    { from: 1, to: 7 }, { from: 2, to: 8 }, { from: 7, to: 13 }, { from: 11, to: 15 }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient for connections */}
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(330 81% 60%)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="hsl(330 81% 60%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(330 81% 60%)" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Glow filter for nodes */}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Connection lines */}
        <g stroke="url(#connectionGradient)" strokeWidth="0.5" fill="none">
          {connections.map((connection, index) => {
            const fromNode = nodes[connection.from];
            const toNode = nodes[connection.to];
            
            return (
              <line
                key={index}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                className="animate-network-line"
                style={{ 
                  animationDelay: `${(fromNode.delay + toNode.delay) / 2}s`,
                  animationDuration: '4s'
                }}
              />
            );
          })}
        </g>
        
        {/* Neural network nodes - now as house icons */}
        <g>
          {nodes.map((node, index) => (
            <g key={index}>
              {/* House icon glow effect */}
              <g 
                transform={`translate(${node.x - node.size * 3}, ${node.y - node.size * 3}) scale(${node.size * 0.6})`}
                opacity="0.15"
                filter="url(#nodeGlow)"
                className="animate-neural-glow"
                style={{ 
                  animationDelay: `${node.delay}s`,
                  animationDuration: '5s'
                }}
              >
                {/* House SVG path in pink */}
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  fill="hsl(330 81% 60%)"
                />
                <polyline points="9,22 9,12 15,12 15,22" fill="hsl(330 81% 60%)" />
              </g>
              
              {/* Main house icon */}
              <g 
                transform={`translate(${node.x - node.size * 3}, ${node.y - node.size * 3}) scale(${node.size * 0.6})`}
                className="animate-neural-float"
                style={{ 
                  animationDelay: `${node.delay + 1}s`,
                  animationDuration: '8s'
                }}
              >
                {/* House SVG path in pink */}
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  fill="hsl(330 81% 60%)"
                  opacity="0.8"
                />
                <polyline points="9,22 9,12 15,12 15,22" fill="hsl(330 81% 70%)" opacity="0.6" />
              </g>
              
              {/* Inner accent */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size * 0.3}
                fill="hsl(330 81% 70%)"
                opacity="0.6"
                className="animate-pulse-gentle"
                style={{ 
                  animationDelay: `${node.delay + 0.5}s`,
                  animationDuration: '3s'
                }}
              />
            </g>
          ))}
        </g>
        
        {/* Data flow particles */}
        <g fill="hsl(330 81% 60%)" opacity="0.6">
          {connections.slice(0, 8).map((connection, index) => {
            const fromNode = nodes[connection.from];
            const toNode = nodes[connection.to];
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            
            return (
              <circle
                key={`particle-${index}`}
                cx={midX}
                cy={midY}
                r="0.8"
                className="animate-pulse-gentle"
                style={{ 
                  animationDelay: `${index * 0.3}s`,
                  animationDuration: '2s'
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}