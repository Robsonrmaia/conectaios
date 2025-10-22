import { ChevronLeft, X, Home, Bed, Bath, Car, Waves, Package, MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Property, BrokerDisplay } from './types';

interface HeroProps {
  property: Property;
  displayBroker?: BrokerDisplay | null;
  onClose: () => void;
  openPhotoGallery: (photos: string[], initialIndex?: number) => void;
}

export function Hero({ property, displayBroker, onClose, openPhotoGallery }: HeroProps) {
  return (
    <div className="relative h-screen w-full">
      <div
        className="relative h-full w-full bg-cover bg-center cursor-pointer property-hero-mobile"
        style={{
          backgroundImage: property.fotos && property.fotos.length > 0
            ? `url(${property.fotos[0]})`
            : `url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80)`,
        }}
        onClick={() => property.fotos && property.fotos.length > 0 && openPhotoGallery(property.fotos, 0)}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const brokerUsername = displayBroker?.username || displayBroker?.minisite_slug;
              if (brokerUsername && typeof window !== 'undefined') {
                window.location.href = `/broker/${brokerUsername}`;
              } else {
                onClose();
              }
            }}
            className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* EXCLUSIVO badge */}
        <div className="absolute top-20 left-4 z-10">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded-full">
            EXCLUSIVO
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-white space-y-4">
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight">{property.titulo}</h1>
          <p className="text-blue-300 text-sm sm:text-xl font-medium">
            {property.neighborhood && property.zipcode
              ? `${property.neighborhood} - CEP: ${property.zipcode}`
              : property.neighborhood || property.city || 'Vila Madalena'}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {property.area > 0 && (
              <SpecItem icon={<Home className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Área" value={`${property.area}m²`} />
            )}
            {property.quartos > 0 && (
              <SpecItem icon={<Bed className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Quartos" value={`${property.quartos}`} />
            )}
            {(property.bathrooms || 0) > 0 && (
              <SpecItem icon={<Bath className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Banheiros" value={`${property.bathrooms}`} />
            )}
            {(property.parking_spots || 0) > 0 && (
              <SpecItem icon={<Car className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Vagas" value={`${property.parking_spots}`} />
            )}
            {property.has_sea_view && (
              <SpecItem icon={<Waves className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Vista" value="Mar" />
            )}
            {property.furnishing_type && property.furnishing_type !== 'unfurnished' && (
              <SpecItem icon={<Package className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Mobiliado" value="Sim" />
            )}
            {(property.sea_distance || 0) > 0 && (
              <SpecItem icon={<MapPin className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Praia" value={`${property.sea_distance}m`} />
            )}
            {(property.valor || 0) > 2000000 && (
              <SpecItem icon={<Eye className="h-6 w-6 md:h-8 md:w-8 text-white" />} label="Categoria" value="Luxo" />
            )}
          </div>
        </div>
      </div>

      {/* Value box */}
      <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
        <div className="flex items-center gap-3 bg-black/60 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
            <span className="text-lg font-bold text-white">R$</span>
          </div>
          <div>
            <div className="text-sm text-gray-300">Valor</div>
            <div className="text-2xl font-bold text-blue-300">{formatCurrency(property.valor)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
        {icon}
      </div>
      <div>
        <div className="text-sm md:text-base text-gray-300">{label}</div>
        <div className="text-lg md:text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}