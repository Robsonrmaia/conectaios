import { MapPin, ChevronLeft } from 'lucide-react';
import RealPropertyMap from '@/components/RealPropertyMap';
import type { Property } from './types';
import { getPlaceIcon } from './utils';

interface Place {
  name: string;
  distance: string;
  icon: string;
}

interface LocationSectionProps {
  property: Property;
  places: Place[];
  placesLoading: boolean;
}

export function LocationSection({ property, places, placesLoading }: LocationSectionProps) {
  return (
    <section className="px-6 py-12 bg-gray-50">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Localização Privilegiada</h2>
      <p className="text-gray-600 text-lg mb-8">
        {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city || ''} - Próximo de tudo que você precisa
      </p>

      <div className="mb-8">
        <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden relative">
          {(property.zipcode || property.neighborhood || property.address) ? (
            <RealPropertyMap
              zipcode={property.zipcode}
              neighborhood={property.neighborhood}
              address={property.address}
              city={property.city}
              state={property.state}
              className="animate-fade-in w-full h-full"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p>Mapa não disponível</p>
                <p className="text-sm">Localização não informada</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-6 animate-fade-in">Pontos de Interesse</h3>

      <div className="space-y-4 mb-8">
        {placesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          places.map((place, index) => {
            const IconComponent = getPlaceIcon(place.icon);
            return (
              <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{place.name}</div>
                  <div className="text-sm text-gray-500">{place.distance}</div>
                </div>
                <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}