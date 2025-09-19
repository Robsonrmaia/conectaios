import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RealPropertyMapProps {
  zipcode?: string;
  neighborhood?: string;
  address?: string;
  city?: string;
  state?: string;
  className?: string;
}

const RealPropertyMap = ({ 
  zipcode, 
  neighborhood, 
  address, 
  city, 
  state, 
  className = "" 
}: RealPropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Get Mapbox token from Supabase secrets
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error getting Mapbox token:', error);
        setMapError(true);
        setIsLoading(false);
      }
    };

    getMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    const geocodeAddress = async () => {
      const query = address || `${neighborhood || ''} ${city || ''} ${state || ''} ${zipcode || ''}`.trim();
      
      if (!query) {
        setMapError(true);
        setIsLoading(false);
        return;
      }

      try {
        // Use Mapbox Geocoding API
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=BR&limit=1`
        );
        
        if (!response.ok) throw new Error('Geocoding failed');
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          initializeMap(lng, lat);
        } else {
          // Fallback to default coordinates (São Paulo)
          initializeMap(-46.6333, -23.5505);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Fallback to default coordinates
        initializeMap(-46.6333, -23.5505);
      }
    };

    const initializeMap = (lng: number, lat: number) => {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [lng, lat],
        zoom: 15,
        attributionControl: false
      });

      // Add marker
      new mapboxgl.Marker({
        color: '#3B82F6'
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsLoading(false);
      });

      map.current.on('error', () => {
        setMapError(true);
        setIsLoading(false);
      });
    };

    geocodeAddress();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken, zipcode, neighborhood, address, city, state]);

  const openInGoogleMaps = () => {
    const query = address || `${neighborhood || ''} ${city || ''} ${zipcode || ''}`.trim();
    if (query) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
    }
  };

  if (!zipcode && !neighborhood && !address && !city) {
    return null;
  }

  return (
    <div className={`relative bg-muted rounded-lg overflow-hidden ${className}`}>
      <div className="w-full h-64 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Carregando mapa...</span>
            </div>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="text-center p-4">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                {neighborhood && (
                  <span className="block font-medium">{neighborhood}</span>
                )}
                {city && (
                  <span className="block">{city}</span>
                )}
                {zipcode && (
                  <span className="block text-xs">CEP: {zipcode}</span>
                )}
              </p>
              <button
                onClick={openInGoogleMaps}
                className="text-xs text-primary hover:underline"
              >
                Ver no Google Maps
              </button>
            </div>
          </div>
        )}
        
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      
      {/* Map overlay with location details */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="text-white">
          {address && (
            <p className="text-sm font-medium mb-1">{address}</p>
          )}
          <div className="flex items-center gap-2 text-xs">
            {neighborhood && <span>{neighborhood}</span>}
            {city && neighborhood && <span>•</span>}
            {city && <span>{city}</span>}
            {zipcode && (neighborhood || city) && <span>•</span>}
            {zipcode && <span>CEP: {zipcode}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealPropertyMap;