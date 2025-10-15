import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipcode, neighborhood, address, city, state } = await req.json();
    
    console.log('🔍 Buscando lugares próximos para:', { zipcode, neighborhood, address, city, state });
    
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!MAPBOX_TOKEN) {
      throw new Error('MAPBOX_PUBLIC_TOKEN não configurado');
    }
    
    // Construir query de localização
    let locationQuery = '';
    if (address) {
      locationQuery = `${address}, ${city || ''} ${state || ''} Brazil`.trim();
    } else {
      const parts = [neighborhood, city, state, 'Brazil'].filter(Boolean);
      locationQuery = parts.join(', ');
    }
    
    if (zipcode) {
      locationQuery = `${locationQuery} ${zipcode}`.trim();
    }
    
    console.log('📍 Location query:', locationQuery);
    
    // Primeiro, obter coordenadas da localização
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1`;
    
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();
    
    if (!geocodingData.features || geocodingData.features.length === 0) {
      console.log('⚠️ Coordenadas não encontradas');
      return new Response(JSON.stringify({ places: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const [lng, lat] = geocodingData.features[0].center;
    console.log('✅ Coordenadas encontradas:', { lat, lng });
    
    // Categorias de pontos de interesse
    const categories = [
      'supermarket',
      'pharmacy',
      'hospital',
      'school',
      'restaurant',
      'shopping_mall',
      'beach',
      'park'
    ];
    
    const places = [];
    
    // Buscar lugares próximos para cada categoria
    for (const category of categories.slice(0, 4)) { // Limitar a 4 categorias
      try {
        const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${category}.json?access_token=${MAPBOX_TOKEN}&proximity=${lng},${lat}&limit=1&types=poi&country=BR`;
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData.features && searchData.features.length > 0) {
          const place = searchData.features[0];
          const [placeLng, placeLat] = place.center;
          
          // Calcular distância aproximada em metros
          const distance = calculateDistance(lat, lng, placeLat, placeLng);
          
          places.push({
            name: place.text || place.place_name,
            distance: formatDistance(distance),
            category: getCategoryName(category),
            icon: getCategoryIcon(category)
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar ${category}:`, error);
      }
    }
    
    console.log('✅ Lugares encontrados:', places.length);
    
    return new Response(JSON.stringify({ places }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ error: error.message, places: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função para calcular distância entre duas coordenadas (fórmula de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

function getCategoryName(category: string): string {
  const names: { [key: string]: string } = {
    'supermarket': 'Supermercado',
    'pharmacy': 'Farmácia',
    'hospital': 'Hospital',
    'school': 'Escola',
    'restaurant': 'Restaurante',
    'shopping_mall': 'Shopping',
    'beach': 'Praia',
    'park': 'Parque'
  };
  return names[category] || category;
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    'supermarket': 'ShoppingBag',
    'pharmacy': 'Hospital',
    'hospital': 'Hospital',
    'school': 'GraduationCap',
    'restaurant': 'Utensils',
    'shopping_mall': 'ShoppingBag',
    'beach': 'Waves',
    'park': 'TreePine'
  };
  return icons[category] || 'MapPin';
}
