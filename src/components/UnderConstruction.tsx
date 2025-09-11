import { motion } from 'framer-motion';
import { Building2, Wrench, Cpu, Network, Clock } from 'lucide-react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

export default function UnderConstruction() {
  const { settings } = useMaintenanceMode();
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
            {settings.constructionMode ? "Em Construção" : "Em Manutenção"}
          </motion.p>

          {/* Description */}
          <motion.div
            className="max-w-md mx-auto space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <p className="text-muted-foreground">
              {settings.constructionMode 
                ? (settings.constructionMessage || "Nossa plataforma está sendo aprimorada para oferecer a melhor experiência para corretores de imóveis.")
                : (settings.maintenanceMessage || "Sistema em manutenção. Voltaremos em breve!")
              }
            </p>
            
            {settings.estimatedTime && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Previsão de retorno: {settings.estimatedTime}</span>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Network className="w-4 h-4" />
              <span>Conectando sistemas...</span>
            </div>
          </motion.div>

          {/* Enhanced Progress Indicator */}
          <motion.div
            className="mt-12 max-w-xs mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            <div className="w-full bg-muted/30 rounded-full h-3 mb-4 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-primary via-green-500 to-primary h-3 rounded-full"
                initial={{ width: "0%", x: "-100%" }}
                animate={{ 
                  width: "85%",
                  x: "0%"
                }}
                transition={{ delay: 1.5, duration: 2.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Sistema quase pronto</p>
              <p className="text-sm font-medium text-primary">85%</p>
            </div>
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