import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyBanner } from '@/components/PropertyBanner';
import { BedDouble, Home } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  finalidade: string;
  descricao: string;
  fotos: string[];
  videos: string[];
  user_id: string;
  created_at: string;
  listing_type: string;
  neighborhood?: string;
  profiles?: {
    nome: string;
  };
  banner_type?: string;
}

interface AutoCarouselProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  autoplayDelay?: number;
}

export function AutoCarousel({ properties, onPropertyClick, autoplayDelay = 4000 }: AutoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || properties.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % properties.length);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [isPlaying, properties.length, autoplayDelay]);

  const handleMouseEnter = () => setIsPlaying(false);
  const handleMouseLeave = () => setIsPlaying(true);

  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Home className="h-8 w-8 mr-2" />
        <span>Nenhum imóvel disponível</span>
      </div>
    );
  }

  const currentProperty = properties[currentIndex];

  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProperty.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full"
        >
          <Card 
            className="h-full bg-gradient-to-br from-white/90 to-blue-50/90 hover:from-white hover:to-blue-50 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => onPropertyClick(currentProperty)}
          >
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              {currentProperty.banner_type && (
                <PropertyBanner bannerType={currentProperty.banner_type} />
              )}
              <img
                src={currentProperty.fotos?.[0] || "/placeholder.svg"}
                alt={currentProperty.titulo}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-base mb-2 line-clamp-2 text-foreground">
                {currentProperty.titulo}
              </h3>
              
              <p className="text-xl font-bold text-primary mb-3">
                {formatCurrency(currentProperty.valor)}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <BedDouble className="h-3 w-3" />
                  <span>{currentProperty.quartos || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 flex items-center justify-center text-xs">🚿</span>
                  <span>{currentProperty.bathrooms || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 flex items-center justify-center text-xs">📐</span>
                  <span>{currentProperty.area || 0}m²</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-1">
                {currentProperty.neighborhood || 'Localização não informada'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="flex justify-center mt-4 gap-1">
        {properties.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-primary scale-125' 
                : 'bg-primary/30 hover:bg-primary/50'
            }`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm rounded-full p-1">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          isPlaying ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </div>
    </div>
  );
}