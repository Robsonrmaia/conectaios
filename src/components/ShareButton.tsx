import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { generatePropertyUrl } from '@/lib/urls';
import { ExternalToolModal } from '@/components/ExternalToolModal';

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
  const [copied, setCopied] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  
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

    // Prepare structured property data for external tool
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

    // Save to localStorage for external tool access
    localStorage.setItem('propertyFormData', JSON.stringify(propertyData));

    // Open HTML generator modal with property data
    setShowGeneratorModal(true);
  };

  const handleGeneratorClose = () => {
    setShowGeneratorModal(false);
  };

  // Build URL for the HTML generator with complete property data and ALL photos
  const generatorUrl = `https://readdy.link/preview/da63f38b-125e-413b-aa01-7e77fb40a0bf/2488182?` +
    `propertyId=${encodeURIComponent(property.id)}&` +
    `title=${encodeURIComponent(property.titulo)}&` +
    `valor=${encodeURIComponent(property.valor.toString())}&` +
    `area=${encodeURIComponent(property.area.toString())}&` +
    `quartos=${encodeURIComponent(property.quartos.toString())}&` +
    `bathrooms=${encodeURIComponent((property.bathrooms || 0).toString())}&` +
    `parking=${encodeURIComponent((property.parking_spots || 0).toString())}&` +
    `tipo=${encodeURIComponent(property.property_type || '')}&` +
    `finalidade=${encodeURIComponent(property.listing_type || '')}&` +
    `bairro=${encodeURIComponent(property.neighborhood || '')}&` +
    `descricao=${encodeURIComponent(property.descricao || '')}&` +
    `fotos=${encodeURIComponent(JSON.stringify(property.fotos || []))}&` +
    `has_sea_view=${encodeURIComponent((property.has_sea_view || false).toString())}&` +
    `furnishing_type=${encodeURIComponent(property.furnishing_type || 'none')}&` +
    `sea_distance=${encodeURIComponent((property.sea_distance || '').toString())}&` +
    `ownerUserId=${encodeURIComponent(property.user_id || '')}`;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleShare}
        disabled={!canShare}
        className={`h-8 text-xs hover:bg-primary hover:text-white ${!canShare ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Compartilhar"
      >
        <Share2 className="h-3 w-3 mr-1" />
        Comp.
      </Button>

      <ExternalToolModal
        isOpen={showGeneratorModal}
        onClose={handleGeneratorClose}
        toolUrl={generatorUrl}
        toolName="Gerador de Proposta HTML"
        toolIcon={Share2}
        propertyData={{
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
        }}
      />
    </>
  );
}