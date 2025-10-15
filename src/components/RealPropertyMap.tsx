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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(`🗺️ ${message}`);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Get Mapbox token from Supabase secrets
    const getMapboxToken = async () => {
      addDebugInfo('Iniciando busca por token Mapbox...');
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        addDebugInfo('✅ Token Mapbox obtido com sucesso');
        setMapboxToken(data.token);
      } catch (error) {
        addDebugInfo(`❌ Erro ao obter token: ${error.message}`);
        setMapError(true);
        setIsLoading(false);
      }
    };

    getMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    const geocodeAddress = async () => {
      // Priorize address completo, depois neighborhood + city + state
      let query = '';
      
      if (address) {
        query = `${address}, ${city || ''} ${state || ''} Brazil`.trim();
      } else {
        const parts = [neighborhood, city, state, 'Brazil'].filter(Boolean);
        query = parts.join(', ');
      }
      
      // Se tiver CEP, adicione para melhor precisão
      if (zipcode) {
        query = `${query} ${zipcode}`.trim();
      }
      
      addDebugInfo(`Geocoding query: ${query}`);
      
      if (!query || query === 'Brazil') {
        addDebugInfo('❌ No location data available');
        setMapError(true);
        setIsLoading(false);
        return;
      }

      try {
        addDebugInfo('🌍 Starting geocoding request...');
        
        // Use Mapbox Geocoding API with Brazilian-specific parameters
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=BR&types=address,poi,place&limit=1&proximity=-46.6333,-23.5505`;
        
        addDebugInfo(`Geocoding URL: ${geocodingUrl.substring(0, 100)}...`);
        
        const response = await fetch(geocodingUrl);
        
        addDebugInfo(`Response status: ${response.status}`);
        if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`);
        
        const data = await response.json();
        addDebugInfo(`Features found: ${data.features?.length || 0}`);
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          const locationName = data.features[0].place_name;
          addDebugInfo(`✅ Coordinates found: ${lat}, ${lng} - ${locationName}`);
          initializeMap(lng, lat);
        } else {
          addDebugInfo('⚠️ No coordinates found, using Ilhéus, BA fallback');
          // Coordenadas de Ilhéus, Bahia
          initializeMap(-39.0498, -14.7897);
        }
      } catch (error) {
        addDebugInfo(`❌ Geocoding error: ${error.message}`);
        addDebugInfo('📍 Using Ilhéus, BA fallback due to error');
        // Coordenadas de Ilhéus, Bahia
        initializeMap(-39.0498, -14.7897);
      }
    };

    const initializeMap = (lng: number, lat: number) => {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12', // Mais colorido
        center: [lng, lat],
        zoom: 16, // Mais próximo
        pitch: 45, // Inclinação 3D
        bearing: 0,
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

      // Adicionar terreno 3D e edifícios
      map.current.on('load', () => {
        // Adicionar fonte de terreno 3D
        map.current!.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        
        // Configurar terreno 3D
        map.current!.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        
        // Adicionar camada de edifícios 3D
        map.current!.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        });
        
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