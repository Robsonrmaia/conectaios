import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

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
    if (!isPlaying || developments.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (developments.length - 2));
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleMouseEnter = () => setIsPlaying(false);
  const handleMouseLeave = () => setIsPlaying(true);

  // Show 3 developments stacked vertically
  const visibleDevelopments = [
    developments[currentIndex],
    developments[(currentIndex + 1) % developments.length],
    developments[(currentIndex + 2) % developments.length]
  ];

  return (
    <div 
      className="relative bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-2xl backdrop-blur-sm border border-primary/10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Novos Empreendimentos
        </h2>
        <p className="text-muted-foreground">
          Descubra os lançamentos mais exclusivos
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {visibleDevelopments.map((dev, index) => (
            <motion.div
              key={`${dev.id}-${index}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group relative overflow-hidden rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {dev.title}
                    </h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                      {dev.description}
                    </p>
                    <Button 
                      variant={dev.disabled ? "secondary" : "default"}
                      size="sm"
                      disabled={dev.disabled}
                      onClick={() => dev.url && !dev.disabled && window.open(dev.url, '_blank')}
                      className="w-full text-xs py-1 h-7"
                    >
                      {dev.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}