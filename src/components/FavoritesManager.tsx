import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface FavoritesManagerProps {
  propertyId: string;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoritesManager({ propertyId, onToggle }: FavoritesManagerProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if property is in favorites (localStorage for now)
    const favorites = JSON.parse(localStorage.getItem('property_favorites') || '[]');
    setIsFavorite(favorites.includes(propertyId));
  }, [propertyId]);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const favorites = JSON.parse(localStorage.getItem('property_favorites') || '[]');
      let newFavorites;
      
      if (isFavorite) {
        // Remove from favorites
        newFavorites = favorites.filter((id: string) => id !== propertyId);
        toast({
          title: "Removido dos favoritos",
          description: "Imóvel removido da sua lista de favoritos",
        });
      } else {
        // Add to favorites
        newFavorites = [...favorites, propertyId];
        toast({
          title: "Adicionado aos favoritos",
          description: "Imóvel adicionado à sua lista de favoritos",
        });
      }
      
      localStorage.setItem('property_favorites', JSON.stringify(newFavorites));
      setIsFavorite(!isFavorite);
      onToggle?.(!isFavorite);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar favoritos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={toggleFavorite}
      disabled={loading}
      className={isFavorite ? 'text-red-500 border-red-200 hover:bg-red-50' : ''}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
    </Button>
  );
}