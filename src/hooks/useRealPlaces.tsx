import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlaceOfInterest {
  name: string;
  distance: string;
  category: string;
  icon: string;
}

interface UseRealPlacesProps {
  zipcode?: string;
  neighborhood?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  has_sea_view?: boolean;
  sea_distance?: number;
  furnishing_type?: string;
  property_type?: string;
}

export function useRealPlaces({
  zipcode,
  neighborhood,
  address,
  city,
  state,
  latitude,
  longitude,
  has_sea_view,
  sea_distance,
  furnishing_type,
  property_type
}: UseRealPlacesProps) {
  const [places, setPlaces] = useState<PlaceOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);

      // If no location data, provide default places
      if (!zipcode && !neighborhood && !address) {
        setPlaces(getDefaultPlaces());
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Buscando lugares próximos...');
        
        // Chamar edge function para buscar lugares reais
        const { data, error: functionError } = await supabase.functions.invoke('nearby-places', {
          body: {
            zipcode,
            neighborhood,
            address,
            city,
            state,
            latitude,
            longitude
          }
        });

        if (functionError) {
          console.error('❌ Erro na edge function:', functionError);
          throw functionError;
        }

        console.log('✅ Lugares recebidos:', data?.places?.length || 0);
        
        // Se não encontrou lugares, usar simulação como fallback
        if (!data?.places || data.places.length === 0) {
          console.log('⚠️ Nenhum lugar encontrado, usando fallback');
          const fallbackPlaces = await simulateNearbyPlaces({
            zipcode,
            neighborhood,
            address,
            has_sea_view,
            sea_distance,
            furnishing_type,
            property_type
          });
          setPlaces(fallbackPlaces);
        } else {
          setPlaces(data.places);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar lugares:', err);
        setError(err as Error);
        
        // Fallback para simulação em caso de erro
        const fallbackPlaces = await simulateNearbyPlaces({
          zipcode,
          neighborhood,
          address,
          has_sea_view,
          sea_distance,
          furnishing_type,
          property_type
        });
        setPlaces(fallbackPlaces);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [zipcode, neighborhood, address, city, state, latitude, longitude]);

  return { places, loading, error };
}

function getDefaultPlaces(): PlaceOfInterest[] {
  return [
    { name: 'Shopping Villa-Lobos', distance: '1.2 km', category: 'Compras', icon: 'ShoppingBag' },
    { name: 'Estação Vila Madalena', distance: '800 m', category: 'Transporte', icon: 'Train' },
    { name: 'Hospital Sírio-Libanês', distance: '2.5 km', category: 'Saúde', icon: 'Hospital' },
    { name: 'PUC-SP', distance: '1.8 km', category: 'Educação', icon: 'GraduationCap' },
    { name: 'Parque Villa-Lobos', distance: '1.5 km', category: 'Lazer', icon: 'TreePine' },
  ];
}

// Simulate nearby places based on location and property features
async function simulateNearbyPlaces(
  propertyFeatures: {
    zipcode?: string;
    neighborhood?: string;
    address?: string;
    has_sea_view?: boolean;
    sea_distance?: number;
    furnishing_type?: string;
    property_type?: string;
  }
): Promise<PlaceOfInterest[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Location-specific places based on neighborhood
  const locationSpecificPlaces: Record<string, PlaceOfInterest[]> = {
    // ... keep existing code
    // Nossa Senhora da Vitória, BA
    'Nossa Senhora da Vitória': [
      { name: 'Dique do Tororó', distance: '800m', category: 'Lazer', icon: 'waves' },
      { name: 'Shopping da Bahia', distance: '1.2km', category: 'Compras', icon: 'shopping-bag' },
      { name: 'Hospital Português', distance: '900m', category: 'Saúde', icon: 'hospital' },
      { name: 'Colégio Central', distance: '600m', category: 'Educação', icon: 'graduation-cap' },
      { name: 'Academia Smart Fit', distance: '400m', category: 'Fitness', icon: 'dumbbell' },
      { name: 'Mercado do Rio Vermelho', distance: '1.1km', category: 'Compras', icon: 'shopping-bag' }
    ],
    // Ilhéus, BA - Zona Sul
    'Zona Sul': [
      { name: 'Shopping Jequitibá', distance: '2.3 km', category: 'Compras', icon: 'shopping-bag' },
      { name: 'Terminal Rodoviário', distance: '1.8 km', category: 'Transporte', icon: 'train' },
      { name: 'Hospital Regional Costa do Cacau', distance: '1.5 km', category: 'Saúde', icon: 'hospital' },
      { name: 'UESC - Universidade Estadual', distance: '3.2 km', category: 'Educação', icon: 'graduation-cap' },
      { name: 'Praia do Milionários', distance: '800 m', category: 'Lazer', icon: 'waves' },
      { name: 'Centro Histórico', distance: '2.1 km', category: 'Turismo', icon: 'tree-pine' },
    ],
    // São Paulo neighborhoods
    'Vila Madalena': [
      { name: 'Shopping Villa-Lobos', distance: '1.2 km', category: 'Compras', icon: 'shopping-bag' },
      { name: 'Estação Vila Madalena (Linha 2)', distance: '800 m', category: 'Transporte', icon: 'train' },
      { name: 'Hospital Sírio-Libanês', distance: '2.5 km', category: 'Saúde', icon: 'hospital' },
      { name: 'PUC-SP Campus Consolação', distance: '1.8 km', category: 'Educação', icon: 'graduation-cap' },
      { name: 'Parque Villa-Lobos', distance: '1.5 km', category: 'Lazer', icon: 'tree-pine' },
      { name: 'Beco do Batman', distance: '600 m', category: 'Turismo', icon: 'tree-pine' },
    ],
    'Pinheiros': [
      { name: 'Shopping Eldorado', distance: '1.8 km', category: 'Compras', icon: 'shopping-bag' },
      { name: 'Estação Pinheiros', distance: '1.2 km', category: 'Transporte', icon: 'train' },
      { name: 'Hospital Albert Einstein', distance: '3.2 km', category: 'Saúde', icon: 'hospital' },
      { name: 'Colégio Bandeirantes', distance: '2.1 km', category: 'Educação', icon: 'graduation-cap' },
      { name: 'Parque do Povo', distance: '2.8 km', category: 'Lazer', icon: 'tree-pine' },
    ],
    'Itaim Bibi': [
      { name: 'Shopping Iguatemi', distance: '2.1 km', category: 'Compras', icon: 'shopping-bag' },
      { name: 'Estação Faria Lima', distance: '1.5 km', category: 'Transporte', icon: 'train' },
      { name: 'Hospital São Luiz', distance: '1.8 km', category: 'Saúde', icon: 'hospital' },
      { name: 'Colégio Dante Alighieri', distance: '2.5 km', category: 'Educação', icon: 'graduation-cap' },
      { name: 'Parque do Ibirapuera', distance: '3.5 km', category: 'Lazer', icon: 'tree-pine' },
    ],
    'Moema': [
      { name: 'Shopping Ibirapuera', distance: '1.3 km', category: 'Compras', icon: 'shopping-bag' },
      { name: 'Estação Moema', distance: '900 m', category: 'Transporte', icon: 'train' },
      { name: 'Hospital Alemão Oswaldo Cruz', distance: '2.2 km', category: 'Saúde', icon: 'hospital' },
      { name: 'Colégio Santa Cruz', distance: '1.7 km', category: 'Educação', icon: 'graduation-cap' },
      { name: 'Parque do Ibirapuera', distance: '800 m', category: 'Lazer', icon: 'tree-pine' },
    ],
  };

  // Base places from neighborhood or generic
  let basePlaces: PlaceOfInterest[] = [];
  
  // Check for Nossa Senhora da Vitória - flexible matching
  const nsVitoriaPattern = /nossa\s+senhora\s+da\s+vit[oó]ria/i;
  const isNossaSenhoraVitoria = propertyFeatures.neighborhood && nsVitoriaPattern.test(propertyFeatures.neighborhood);
  
  if (isNossaSenhoraVitoria && locationSpecificPlaces['Nossa Senhora da Vitória']) {
    basePlaces = [...locationSpecificPlaces['Nossa Senhora da Vitória']];
  } else if (propertyFeatures.neighborhood && locationSpecificPlaces[propertyFeatures.neighborhood]) {
    basePlaces = [...locationSpecificPlaces[propertyFeatures.neighborhood]];
  } else {
    basePlaces = [
      { name: 'Shopping Center Local', distance: '1.5 km', category: 'Compras', icon: 'shopping-bag' },
      { name: 'Terminal Rodoviário', distance: '1.1 km', category: 'Transporte', icon: 'train' },
      { name: 'Hospital Regional', distance: '2.3 km', category: 'Saúde', icon: 'hospital' },
      { name: 'Escola Estadual', distance: '750 m', category: 'Educação', icon: 'graduation-cap' },
      { name: 'Praça Central', distance: '500 m', category: 'Lazer', icon: 'tree-pine' },
      { name: 'Supermercado', distance: '400 m', category: 'Compras', icon: 'shopping-bag' },
    ];
  }

  // Add property-specific features
  if (propertyFeatures) {
    // Add beach/sea related places if property has sea view or distance
    if (propertyFeatures.has_sea_view || (propertyFeatures.sea_distance && propertyFeatures.sea_distance < 1000)) {
      const beachDistance = propertyFeatures.sea_distance ? `${propertyFeatures.sea_distance}m` : '200m';
      basePlaces.unshift({
        name: 'Praia Próxima',
        distance: beachDistance,
        category: 'Lazer',
        icon: 'waves'
      });
    }

    // Add furnished-related amenities
    if (propertyFeatures.furnishing_type === 'furnished' || propertyFeatures.furnishing_type === 'semi_furnished') {
      basePlaces.push({
        name: 'Loja de Móveis e Decoração',
        distance: '1.2 km',
        category: 'Decoração',
        icon: 'palette'
      });
    }

    // Add property type specific places
    if (propertyFeatures.property_type === 'apartamento') {
      basePlaces.push({
        name: 'Academia/Fitness',
        distance: '600m',
        category: 'Fitness',
        icon: 'dumbbell'
      });
    }
  }

  return basePlaces.slice(0, 6); // Limit to 6 places
}