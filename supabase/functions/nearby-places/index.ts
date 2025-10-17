import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceOfInterest {
  name: string;
  distance: string;
  category: string;
  icon: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipcode, neighborhood, address, city, state, latitude, longitude } = await req.json();
    
    console.log('🔍 Buscando lugares próximos para:', { zipcode, neighborhood, address, city, state, latitude, longitude });

    // Função para retornar lugares reais de Ilhéus
    function getLocalPlaces(city: string, neighborhood: string): PlaceOfInterest[] {
      const cityNorm = (city || '').toLowerCase();
      const neighborhoodNorm = (neighborhood || '').toLowerCase();
      
      // Pontos específicos para Ilhéus, bairro Nossa Senhora da Vitória
      if (cityNorm.includes('ilh') || cityNorm.includes('ilheus')) {
        if (neighborhoodNorm.includes('vit') || neighborhoodNorm.includes('nossa')) {
          return [
            { name: 'Praia do Cristo', distance: '350m', category: 'Lazer', icon: 'waves' },
            { name: 'Catedral de São Sebastião', distance: '800m', category: 'Cultura', icon: 'building-2' },
            { name: 'Hospital São José', distance: '1.2km', category: 'Saúde', icon: 'hospital' },
            { name: 'Shopping Jequitibá', distance: '2.5km', category: 'Compras', icon: 'shopping-bag' },
            { name: 'UESC - Universidade Estadual', distance: '5km', category: 'Educação', icon: 'graduation-cap' }
          ];
        }
        
        // Pontos gerais de Ilhéus (outros bairros)
        return [
          { name: 'Centro Histórico', distance: '1km', category: 'Cultura', icon: 'building-2' },
          { name: 'Praia dos Milionários', distance: '2km', category: 'Lazer', icon: 'waves' },
          { name: 'Aeroporto Jorge Amado', distance: '3km', category: 'Transporte', icon: 'train' },
          { name: 'Mercado Municipal', distance: '1.5km', category: 'Compras', icon: 'shopping-bag' },
          { name: 'Casa de Cultura Jorge Amado', distance: '800m', category: 'Cultura', icon: 'graduation-cap' }
        ];
      }
      
      return []; // Se não for Ilhéus, retornar vazio e usar Mapbox
    }

    // Get Mapbox token from secrets
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_TOKEN');
    
    if (!MAPBOX_TOKEN) {
      console.warn('⚠️ MAPBOX_TOKEN não configurado');
      // Usar lugares locais como fallback
      const localPlaces = getLocalPlaces(city, neighborhood);
      return new Response(
        JSON.stringify({ places: localPlaces }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar coordenadas fornecidas ou geocodificar o endereço
    let lat = latitude;
    let lon = longitude;
    
    if (!lat || !lon) {
      console.log('📍 Geocodificando endereço...');
      const searchQuery = [address, neighborhood, city, state].filter(Boolean).join(', ');
      
      if (!searchQuery) {
        console.log('⚠️ Sem dados de localização suficientes');
        const localPlaces = getLocalPlaces(city, neighborhood);
        return new Response(
          JSON.stringify({ places: localPlaces }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.features && geocodeData.features.length > 0) {
        [lon, lat] = geocodeData.features[0].center;
        console.log('✅ Coordenadas obtidas via geocoding:', { lat, lon });
      } else {
        console.log('❌ Não foi possível geocodificar, usando lugares locais');
        const localPlaces = getLocalPlaces(city, neighborhood);
        return new Response(
          JSON.stringify({ places: localPlaces }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('✅ Usando coordenadas fornecidas:', { lat, lon });
    }

    // Search for nearby places using Mapbox Search API
    const places: PlaceOfInterest[] = [];
    
    // Define search categories and their mapping
    const searchCategories = [
      { query: 'shopping mall', category: 'Compras', icon: 'shopping-bag' },
      { query: 'supermarket', category: 'Compras', icon: 'shopping-bag' },
      { query: 'bus station', category: 'Transporte', icon: 'train' },
      { query: 'hospital', category: 'Saúde', icon: 'hospital' },
      { query: 'pharmacy', category: 'Saúde', icon: 'hospital' },
      { query: 'school', category: 'Educação', icon: 'graduation-cap' },
      { query: 'park', category: 'Lazer', icon: 'tree-pine' },
      { query: 'beach', category: 'Lazer', icon: 'waves' },
    ];

    for (const searchItem of searchCategories) {
      try {
        // Use Mapbox Geocoding API with types=poi
        const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchItem.query)}.json?proximity=${lon},${lat}&access_token=${MAPBOX_TOKEN}&limit=1&types=poi`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.features && searchData.features.length > 0) {
          const feature = searchData.features[0];
          const placeName = feature.text || feature.place_name;
          const placeCoords = feature.center;
          
          // Calculate distance
          const distance = calculateDistance(
            lat, lon,
            placeCoords[1], placeCoords[0]
          );

          // Only add if distance is reasonable (< 5km)
          if (distance < 5) {
            places.push({
              name: placeName,
              distance: formatDistance(distance),
              category: searchItem.category,
              icon: searchItem.icon
            });
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar ${searchItem.query}:`, error);
      }
    }

    console.log(`✅ ${places.length} lugares encontrados`);

    return new Response(
      JSON.stringify({ places: places.slice(0, 6) }), // Limit to 6 places
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função nearby-places:', error);
    return new Response(
      JSON.stringify({ error: error.message, places: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)} km`;
}

function mapCategory(category: string): { label: string; icon: string } {
  const categoryMap: Record<string, { label: string; icon: string }> = {
    'shopping_mall': { label: 'Compras', icon: 'shopping-bag' },
    'convenience': { label: 'Compras', icon: 'shopping-bag' },
    'supermarket': { label: 'Compras', icon: 'shopping-bag' },
    'transit_station': { label: 'Transporte', icon: 'train' },
    'bus_station': { label: 'Transporte', icon: 'train' },
    'subway_station': { label: 'Transporte', icon: 'train' },
    'hospital': { label: 'Saúde', icon: 'hospital' },
    'clinic': { label: 'Saúde', icon: 'hospital' },
    'pharmacy': { label: 'Saúde', icon: 'hospital' },
    'school': { label: 'Educação', icon: 'graduation-cap' },
    'university': { label: 'Educação', icon: 'graduation-cap' },
    'college': { label: 'Educação', icon: 'graduation-cap' },
    'park': { label: 'Lazer', icon: 'tree-pine' },
    'beach': { label: 'Lazer', icon: 'waves' },
    'recreation': { label: 'Lazer', icon: 'tree-pine' },
  };

  return categoryMap[category] || { label: 'Ponto de Interesse', icon: 'map-pin' };
}