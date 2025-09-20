import { useState, useEffect } from 'react';

interface PlaceOfInterest {
  name: string;
  distance: string;
  category: 'shopping' | 'transport' | 'hospital' | 'school' | 'park' | 'restaurant' | 'other';
  icon: string;
}

interface UseRealPlacesProps {
  zipcode?: string;
  neighborhood?: string;
  address?: string;
  has_sea_view?: boolean;
  sea_distance?: number;
  furnishing_type?: string;
  property_type?: string;
}

export function useRealPlaces({ zipcode, neighborhood, address, has_sea_view, sea_distance, furnishing_type, property_type }: UseRealPlacesProps) {
  const [places, setPlaces] = useState<PlaceOfInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!zipcode && !neighborhood && !address) {
        // Set default places for fallback
        setPlaces([
          { name: 'Shopping Villa-Lobos', distance: '1.2 km', category: 'shopping', icon: 'ShoppingBag' },
          { name: 'Estação Vila Madalena', distance: '800 m', category: 'transport', icon: 'Train' },
          { name: 'Hospital Sírio-Libanês', distance: '2.5 km', category: 'hospital', icon: 'Hospital' },
          { name: 'PUC-SP', distance: '1.8 km', category: 'school', icon: 'GraduationCap' },
          { name: 'Parque Villa-Lobos', distance: '1.5 km', category: 'park', icon: 'TreePine' },
        ]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Create search query based on available location data
        const query = address || `${neighborhood || ''} ${zipcode || ''}`.trim();
        
        if (!query) {
          throw new Error('Localização não especificada');
        }

        // In a real implementation, this would call Google Places API
        // For now, we'll simulate with location-aware data and integrate real property features
        const simulatedPlaces = await simulateNearbyPlaces(query, neighborhood, {
          has_sea_view,
          sea_distance,
          furnishing_type,
          property_type
        });
        setPlaces(simulatedPlaces);
      } catch (err) {
        console.error('Error fetching places:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar pontos de interesse');
        
        // Fallback to default places on error
        setPlaces([
          { name: 'Centro Comercial Local', distance: '500 m', category: 'shopping', icon: 'ShoppingBag' },
          { name: 'Transporte Público', distance: '300 m', category: 'transport', icon: 'Train' },
          { name: 'Hospital da Região', distance: '1.2 km', category: 'hospital', icon: 'Hospital' },
          { name: 'Escola Municipal', distance: '800 m', category: 'school', icon: 'GraduationCap' },
          { name: 'Praça Local', distance: '400 m', category: 'park', icon: 'TreePine' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [zipcode, neighborhood, address]);

  return { places, loading, error };
}

// Simulate nearby places based on location and property features
async function simulateNearbyPlaces(
  query: string, 
  neighborhood?: string, 
  propertyFeatures?: {
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
    // Ilhéus, BA - Zona Sul
    'Zona Sul': [
      { name: 'Shopping Jequitibá', distance: '2.3 km', category: 'shopping', icon: 'ShoppingBag' },
      { name: 'Terminal Rodoviário', distance: '1.8 km', category: 'transport', icon: 'MapPin' },
      { name: 'Hospital Regional Costa do Cacau', distance: '1.5 km', category: 'hospital', icon: 'Hospital' },
      { name: 'UESC - Universidade Estadual', distance: '3.2 km', category: 'school', icon: 'GraduationCap' },
      { name: 'Praia do Milionários', distance: '800 m', category: 'park', icon: 'Waves' },
      { name: 'Centro Histórico', distance: '2.1 km', category: 'other', icon: 'MapPin' },
    ],
    // São Paulo neighborhoods
    'Vila Madalena': [
      { name: 'Shopping Villa-Lobos', distance: '1.2 km', category: 'shopping', icon: 'ShoppingBag' },
      { name: 'Estação Vila Madalena (Linha 2)', distance: '800 m', category: 'transport', icon: 'Train' },
      { name: 'Hospital Sírio-Libanês', distance: '2.5 km', category: 'hospital', icon: 'Hospital' },
      { name: 'PUC-SP Campus Consolação', distance: '1.8 km', category: 'school', icon: 'GraduationCap' },
      { name: 'Parque Villa-Lobos', distance: '1.5 km', category: 'park', icon: 'TreePine' },
      { name: 'Beco do Batman', distance: '600 m', category: 'other', icon: 'MapPin' },
    ],
    'Pinheiros': [
      { name: 'Shopping Eldorado', distance: '1.8 km', category: 'shopping', icon: 'ShoppingBag' },
      { name: 'Estação Pinheiros', distance: '1.2 km', category: 'transport', icon: 'Train' },
      { name: 'Hospital Albert Einstein', distance: '3.2 km', category: 'hospital', icon: 'Hospital' },
      { name: 'Colégio Bandeirantes', distance: '2.1 km', category: 'school', icon: 'GraduationCap' },
      { name: 'Parque do Povo', distance: '2.8 km', category: 'park', icon: 'TreePine' },
    ],
    'Itaim Bibi': [
      { name: 'Shopping Iguatemi', distance: '2.1 km', category: 'shopping', icon: 'ShoppingBag' },
      { name: 'Estação Faria Lima', distance: '1.5 km', category: 'transport', icon: 'Train' },
      { name: 'Hospital São Luiz', distance: '1.8 km', category: 'hospital', icon: 'Hospital' },
      { name: 'Colégio Dante Alighieri', distance: '2.5 km', category: 'school', icon: 'GraduationCap' },
      { name: 'Parque do Ibirapuera', distance: '3.5 km', category: 'park', icon: 'TreePine' },
    ],
    'Moema': [
      { name: 'Shopping Ibirapuera', distance: '1.3 km', category: 'shopping', icon: 'ShoppingBag' },
      { name: 'Estação Moema', distance: '900 m', category: 'transport', icon: 'Train' },
      { name: 'Hospital Alemão Oswaldo Cruz', distance: '2.2 km', category: 'hospital', icon: 'Hospital' },
      { name: 'Colégio Santa Cruz', distance: '1.7 km', category: 'school', icon: 'GraduationCap' },
      { name: 'Parque do Ibirapuera', distance: '800 m', category: 'park', icon: 'TreePine' },
    ],
  };

  // Base places from neighborhood or generic
  let basePlaces: PlaceOfInterest[] = [];
  
  if (neighborhood && locationSpecificPlaces[neighborhood]) {
    basePlaces = [...locationSpecificPlaces[neighborhood]];
  } else {
    basePlaces = [
      { name: 'Shopping Center Local', distance: '1.5 km', category: 'shopping', icon: 'ShoppingBag' },
      { name: 'Terminal Rodoviário', distance: '1.1 km', category: 'transport', icon: 'MapPin' },
      { name: 'Hospital Regional', distance: '2.3 km', category: 'hospital', icon: 'Hospital' },
      { name: 'Escola Estadual', distance: '750 m', category: 'school', icon: 'GraduationCap' },
      { name: 'Praça Central', distance: '500 m', category: 'park', icon: 'TreePine' },
      { name: 'Supermercado', distance: '400 m', category: 'other', icon: 'MapPin' },
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
        category: 'park',
        icon: 'Waves'
      });
    }

    // Add furnished-related amenities
    if (propertyFeatures.furnishing_type === 'furnished' || propertyFeatures.furnishing_type === 'semi_furnished') {
      basePlaces.push({
        name: 'Loja de Móveis e Decoração',
        distance: '1.2 km',
        category: 'shopping',
        icon: 'Package'
      });
    }

    // Add property type specific places
    if (propertyFeatures.property_type === 'apartamento') {
      basePlaces.push({
        name: 'Academia/Fitness',
        distance: '600m',
        category: 'other',
        icon: 'Dumbbell'
      });
    }
  }

  return basePlaces.slice(0, 6); // Limit to 6 places
}