import { motion } from "framer-motion";
import { Building2, Wrench, Cpu, Network } from "lucide-react";

export default function UnderConstruction() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Network Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 800 600">
            <defs>
              <linearGradient id="connectionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity="0.1" />
                <stop offset="50%" stopColor="hsl(142 76% 36%)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(142 76% 36%)" stopOpacity="0.1" />
              </linearGradient>
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Animated Connection Lines */}
            {[...Array(8)].map((_, i) => (
              <motion.line
                key={i}
                x1={50 + i * 100}
                y1={100}
                x2={150 + i * 80}
                y2={300}
                stroke="url(#connectionGrad)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Network Nodes */}
            {[...Array(12)].map((_, i) => (
              <motion.circle
                key={i}
                cx={80 + (i % 4) * 180}
                cy={100 + Math.floor(i / 4) * 150}
                r="6"
                fill="hsl(142 76% 50%)"
                filter="url(#glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </svg>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Animated Logo/Icon */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="relative mx-auto w-24 h-24 mb-6">
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative z-10 w-full h-full bg-primary rounded-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-green-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            ConectaIOS
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Estamos construindo algo incrível
          </motion.p>

          {/* Construction Animation */}
          <motion.div
            className="flex justify-center items-center gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Wrench className="w-8 h-8 text-primary" />
            </motion.div>
            
            <motion.div
              className="flex gap-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-primary rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>

            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Cpu className="w-8 h-8 text-primary" />
            </motion.div>
          </motion.div>

          {/* Description */}
          <motion.div
            className="max-w-md mx-auto space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <p className="text-muted-foreground">
              Nossa plataforma está sendo aprimorada para oferecer a melhor experiência para corretores de imóveis.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Network className="w-4 h-4" />
              <span>Conectando sistemas...</span>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            className="mt-12 max-w-xs mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <div className="w-full bg-muted/30 rounded-full h-2 mb-4">
              <motion.div
                className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "75%" }}
                transition={{ delay: 1.5, duration: 2, ease: "easeOut" }}
              />
            </div>
            <p className="text-sm text-muted-foreground">75% concluído</p>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="mt-16 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <p>© 2024 ConectaIOS. Em breve!</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}