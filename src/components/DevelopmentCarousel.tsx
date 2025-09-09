import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

interface Development {
  id: string;
  title: string;
  description: string;
  type: 'iframe' | 'placeholder';
  url?: string;
  icon?: string;
  buttonText: string;
  disabled?: boolean;
}

const developments: Development[] = [
  {
    id: '1',
    title: 'Orquidário Residencial',
    description: 'Lançamento exclusivo com área verde preservada',
    type: 'iframe',
    url: 'https://orquidario.gicarneiroimoveis.com.br',
    buttonText: 'Saiba Mais'
  },
  {
    id: '2',
    title: 'Vila das Palmeiras',
    description: 'Em breve na região nobre de Ilhéus',
    type: 'placeholder',
    buttonText: 'Em Breve',
    disabled: true
  }
];

export function DevelopmentCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || developments.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % developments.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleMouseEnter = () => setIsPlaying(false);
  const handleMouseLeave = () => setIsPlaying(true);

  const currentDevelopment = developments[currentIndex];

  return (
    <div 
      className="relative h-32 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDevelopment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="flex gap-3 p-3 bg-white/60 rounded-lg border border-green-100 h-full">
            <div className="flex-shrink-0">
              {currentDevelopment.type === 'iframe' && currentDevelopment.url ? (
                <iframe
                  src={currentDevelopment.url}
                  className="w-16 h-16 rounded-lg border border-gray-200"
                  title={currentDevelopment.title}
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-1 truncate">
                  {currentDevelopment.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {currentDevelopment.description}
                </p>
              </div>
              <div className="mt-2">
                <Button 
                  size="sm" 
                  className="h-6 text-xs px-3"
                  disabled={currentDevelopment.disabled}
                  onClick={() => {
                    if (currentDevelopment.url && !currentDevelopment.disabled) {
                      window.open(currentDevelopment.url, '_blank');
                    }
                  }}
                >
                  {currentDevelopment.buttonText}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}