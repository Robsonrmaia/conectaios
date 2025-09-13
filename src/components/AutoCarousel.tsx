import { useState, useEffect, useRef } from 'react';
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
  property_type?: string;
  neighborhood?: string;
  profiles?: {
    nome: string;
  } | null;
  conectaios_brokers?: {
    id: string;
    name: string;
    avatar_url?: string;
    creci?: string;
    bio?: string;
  } | null;
  banner_type?: string;
}

interface AutoCarouselProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  autoplayDelay?: number;
}

export function AutoCarousel({ properties, onPropertyClick, autoplayDelay = 4000 }: AutoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for visibility-based autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && properties.length > 1) {
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    return () => observer.disconnect();
  }, [properties.length]);

  useEffect(() => {
    if (!isPlaying || !isVisible || properties.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % properties.length);
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [isPlaying, isVisible, properties.length, autoplayDelay]);

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
      ref={carouselRef}
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
            <div className="relative h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-blue-200">
              {currentProperty.banner_type && (
                <PropertyBanner bannerType={currentProperty.banner_type} />
              )}
              {currentProperty.fotos && currentProperty.fotos.length > 0 && currentProperty.fotos[0] ? (
                <img
                  src={currentProperty.fotos[0]}
                  alt={currentProperty.titulo}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    console.log('Erro ao carregar imagem:', currentProperty.fotos[0]);
                    e.currentTarget.src = `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80`;
                  }}
                  onLoad={() => {
                    console.log('Imagem carregada com sucesso:', currentProperty.fotos[0]);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                  <div className="text-center text-blue-600">
                    <div className="text-4xl mb-2">
                      {currentProperty.property_type === 'casa' ? '🏠' : 
                       currentProperty.property_type === 'apartamento' ? '🏢' :
                       currentProperty.property_type === 'comercial' ? '🏪' : '🏡'}
                    </div>
                    <div className="text-sm font-medium">
                      {currentProperty.property_type || 'Imóvel'}
                    </div>
                  </div>
                </div>
              )}
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
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                {currentProperty.conectaios_brokers?.avatar_url ? (
                  <img 
                    src={currentProperty.conectaios_brokers.avatar_url} 
                    alt={currentProperty.conectaios_brokers.name}
                    className="w-5 h-5 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-600">
                    {currentProperty.conectaios_brokers?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'C'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium">Corretor:</span> 
                  <span className="ml-1">{currentProperty.conectaios_brokers?.name || currentProperty.profiles?.nome || 'Não informado'}</span>
                  {currentProperty.conectaios_brokers?.creci && (
                    <span className="block text-[10px] text-muted-foreground/70">CRECI: {currentProperty.conectaios_brokers.creci}</span>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-1">
                {currentProperty.neighborhood || 'Localização não informada'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>


      {/* Auto-play indicator */}
      <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm rounded-full p-1">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          isPlaying ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </div>
    </div>
  );
}