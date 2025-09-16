import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { generatePropertyUrl } from '@/lib/urls';
import { PropertyProposalGenerator } from '@/components/PropertyProposalGenerator';

interface ShareButtonProps {
  property: Property; // Full property object instead of separate fields
  isOwner?: boolean;
  isAuthorized?: boolean;
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  fotos: string[];
  user_id?: string;
  listing_type?: string;
  property_type?: string;
  neighborhood?: string;
  descricao?: string;
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
}

export function ShareButton({ 
  property,
  isOwner = false, 
  isAuthorized = false 
}: ShareButtonProps) {
  const { user } = useAuth();
  const [showProposalGenerator, setShowProposalGenerator] = useState(false);
  
  const canShare = isOwner || isAuthorized || (user?.id === property.user_id);

  const handleShare = async () => {
    if (!canShare) {
      toast({
        title: "Acesso negado",
        description: "Apenas o corretor responsável pode compartilhar este imóvel",
        variant: "destructive",
      });
      return;
    }

    setShowProposalGenerator(true);
  };

  const handleGeneratorClose = () => {
    setShowProposalGenerator(false);
  };

  // Prepare property data for the generator
  const propertyData = {
    propertyId: property.id,
    title: property.titulo,
    valor: property.valor,
    area: property.area,
    quartos: property.quartos,
    bathrooms: property.bathrooms || 0,
    parking: property.parking_spots || 0,
    tipo: property.property_type || '',
    finalidade: property.listing_type || '',
    bairro: property.neighborhood || '',
    descricao: property.descricao || '',
    fotos: property.fotos || [],
    has_sea_view: property.has_sea_view || false,
    furnishing_type: property.furnishing_type || 'none',
    sea_distance: property.sea_distance || '',
    ownerUserId: property.user_id || ''
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleShare}
        disabled={!canShare}
        className={`h-8 text-xs hover:bg-primary hover:text-white ${!canShare ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Gerar Proposta"
      >
        <Share2 className="h-3 w-3 mr-1" />
        Proposta
      </Button>

      <PropertyProposalGenerator
        property={propertyData}
        isOpen={showProposalGenerator}
        onClose={handleGeneratorClose}
      />
    </>
  );
}