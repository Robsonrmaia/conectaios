import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  zipcode?: string;
  neighborhood?: string;
  address?: string;
  className?: string;
}

const PropertyMap = ({ zipcode, neighborhood, address, className = "" }: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);
  const [mapError, setMapError] = React.useState(false);

  useEffect(() => {
    // Simulate map loading for now
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const generateMapUrl = () => {
    const query = address || `${neighborhood || ''} ${zipcode || ''}`.trim();
    if (!query) return '';
    
    // Using Google Static Maps API as fallback
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(query)}&zoom=15&size=400x300&maptype=roadmap&markers=color:red%7C${encodeURIComponent(query)}&key=YOUR_GOOGLE_MAPS_API_KEY`;
  };

  const openInGoogleMaps = () => {
    const query = address || `${neighborhood || ''} ${zipcode || ''}`.trim();
    if (query) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
    }
  };

  if (!zipcode && !neighborhood && !address) {
    return null;
  }

  return (
    <div className={`relative bg-muted rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-64 flex items-center justify-center">
        {!isMapLoaded ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span>Carregando mapa...</span>
          </div>
        ) : mapError ? (
          <div className="text-center p-4">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {neighborhood && (
                <span className="block font-medium">{neighborhood}</span>
              )}
              {zipcode && (
                <span className="block text-xs">CEP: {zipcode}</span>
              )}
            </p>
          </div>
        ) : (
          <div 
            className="w-full h-full cursor-pointer relative group"
            onClick={openInGoogleMaps}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex flex-col items-center justify-center text-center p-4">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23C4B5FD%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22m0%2040l40-40h-40v40zm40%200v-40h-40l40%2040z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
              
              <div className="relative z-10">
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-3 animate-bounce" />
                
                {neighborhood && (
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-1">
                    {neighborhood}
                  </h3>
                )}
                
                {zipcode && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    CEP: {zipcode}
                  </p>
                )}
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg px-3 py-2 text-xs font-medium backdrop-blur-sm">
                    Clique para ver no Google Maps
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="absolute top-1/3 right-8 w-1 h-1 bg-blue-300 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Map overlay with location details */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="text-white">
          {address && (
            <p className="text-sm font-medium mb-1">{address}</p>
          )}
          <div className="flex items-center gap-2 text-xs">
            {neighborhood && <span>{neighborhood}</span>}
            {zipcode && <span>•</span>}
            {zipcode && <span>CEP: {zipcode}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;