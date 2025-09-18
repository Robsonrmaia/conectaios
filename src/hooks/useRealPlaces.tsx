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
}

export function useRealPlaces({ zipcode, neighborhood, address }: UseRealPlacesProps) {
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
        // For now, we'll simulate with location-aware data
        const simulatedPlaces = await simulateNearbyPlaces(query, neighborhood);
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

// Simulate nearby places based on location
async function simulateNearbyPlaces(query: string, neighborhood?: string): Promise<PlaceOfInterest[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Location-specific places based on neighborhood
  const locationSpecificPlaces: Record<string, PlaceOfInterest[]> = {
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

  // Check if neighborhood matches any specific location
  if (neighborhood && locationSpecificPlaces[neighborhood]) {
    return locationSpecificPlaces[neighborhood];
  }

  // Generic places for unknown neighborhoods
  return [
    { name: 'Shopping Center Local', distance: '1.5 km', category: 'shopping', icon: 'ShoppingBag' },
    { name: 'Estação de Metrô/Trem', distance: '1.1 km', category: 'transport', icon: 'Train' },
    { name: 'Hospital Regional', distance: '2.3 km', category: 'hospital', icon: 'Hospital' },
    { name: 'Escola Estadual', distance: '750 m', category: 'school', icon: 'GraduationCap' },
    { name: 'Praça Central', distance: '500 m', category: 'park', icon: 'TreePine' },
    { name: 'Supermercado', distance: '400 m', category: 'other', icon: 'MapPin' },
  ];
}