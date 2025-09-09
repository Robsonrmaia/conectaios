import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';

interface Development {
  id: string;
  title: string;
  description: string;
  image: string;
  url?: string;
  buttonText: string;
  disabled?: boolean;
}

const developments: Development[] = [
  {
    id: '1',
    title: 'Orquidário Residencial',
    description: 'Lançamento exclusivo com área verde preservada',
    image: 'bg-gradient-to-br from-emerald-100 to-green-200',
    url: 'https://orquidario.gicarneiroimoveis.com.br',
    buttonText: 'Saiba Mais'
  },
  {
    id: '2',
    title: 'Vila das Palmeiras',
    description: 'Em breve na região nobre de Ilhéus',
    image: 'bg-gradient-to-br from-blue-100 to-cyan-200',
    buttonText: 'Em Breve',
    disabled: true
  },
  {
    id: '3',
    title: 'Residencial Atlântico',
    description: 'Vista para o mar, apartamentos 2 e 3 quartos',
    image: 'bg-gradient-to-br from-sky-100 to-blue-200',
    buttonText: 'Saiba Mais'
  },
  {
    id: '4',
    title: 'Condomínio Jardins',
    description: 'Área de lazer completa, pronto para morar',
    image: 'bg-gradient-to-br from-violet-100 to-purple-200',
    buttonText: 'Conheça'
  },
  {
    id: '5',
    title: 'Edifício Ilhéus Prime',
    description: 'Centro, apartamentos comerciais e residenciais',
    image: 'bg-gradient-to-br from-amber-100 to-yellow-200',
    buttonText: 'Detalhes'
  }
];

export function DevelopmentCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || developments.length <= 2) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (developments.length - 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleMouseEnter = () => setIsPlaying(false);
  const handleMouseLeave = () => setIsPlaying(true);

  const visibleDevelopments = developments.slice(currentIndex, currentIndex + 2);
  if (visibleDevelopments.length === 1) {
    visibleDevelopments.push(developments[0]);
  }

  return (
    <div 
      className="relative h-32 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 flex gap-3"
        >
          {visibleDevelopments.map((development, index) => (
            <div key={development.id} className="flex-1 min-w-0">
              <div className="flex gap-3 p-3 bg-white/60 rounded-lg border border-green-100 h-full">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 ${development.image} rounded-lg flex items-center justify-center`}>
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-1 truncate">
                      {development.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {development.description}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Button 
                      size="sm" 
                      className="h-6 text-xs px-3"
                      disabled={development.disabled}
                      onClick={() => {
                        if (development.url && !development.disabled) {
                          window.open(development.url, '_blank');
                        }
                      }}
                    >
                      {development.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}