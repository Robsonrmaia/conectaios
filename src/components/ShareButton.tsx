import { useState } from 'react';
import { Share2, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { generatePropertyUrl } from '@/lib/urls';
import { PropertyPresentation } from '@/components/PropertyPresentation';

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
  const [showExternalTool, setShowExternalTool] = useState(false);
  
  const canShare = isOwner || isAuthorized || (user?.id === property.user_id);

  const handleShareModal = async () => {
    if (!canShare) {
      toast({
        title: "Acesso negado",
        description: "Apenas o corretor responsável pode compartilhar este imóvel",
        variant: "destructive",
      });
      return;
    }

    setShowExternalTool(true);
  };

  const handleShareNewTab = async () => {
    if (!canShare) {
      toast({
        title: "Acesso negado",
        description: "Apenas o corretor responsável pode compartilhar este imóvel",
        variant: "destructive",
      });
      return;
    }

    // Save data to localStorage for readdy.link to access
    const dataToSave = JSON.stringify(propertyData);
    localStorage.setItem('propertyData', dataToSave);
    localStorage.setItem('currentProperty', dataToSave);
    localStorage.setItem('selectedProperty', dataToSave);
    localStorage.setItem('readdy_property_data', dataToSave);

    // Build URL with query parameters
    const baseUrl = "https://readdy.link/preview/da63f38b-125e-413b-aa01-7e77fb40a0bf/2488182/admin";
    const params = new URLSearchParams({
      propertyId: propertyData.propertyId,
      title: propertyData.title,
      valor: propertyData.valor.toString(),
      area: propertyData.area.toString(),
      quartos: propertyData.quartos.toString(),
      bathrooms: propertyData.bathrooms.toString(),
      parking: propertyData.parking.toString(),
      tipo: propertyData.tipo,
      finalidade: propertyData.finalidade,
      bairro: propertyData.bairro,
      descricao: propertyData.descricao,
      fotos: propertyData.fotos.join(','),
      has_sea_view: propertyData.has_sea_view.toString(),
      furnishing_type: propertyData.furnishing_type,
      sea_distance: propertyData.sea_distance.toString(),
      ownerUserId: propertyData.ownerUserId
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;

    // Open in new tab
    window.open(fullUrl, '_blank', 'noopener,noreferrer');

    toast({
      title: "Abrindo gerador de propostas",
      description: "Dados do imóvel enviados para nova aba",
    });
  };

  const handleToolClose = () => {
    setShowExternalTool(false);
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!canShare}
            className={`h-8 text-xs hover:bg-primary hover:text-white ${!canShare ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Gerar Proposta"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Proposta
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleShareModal}>
            <Share2 className="h-4 w-4 mr-2" />
            Visualizar Proposta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareNewTab}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em Nova Aba
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PropertyPresentation
        property={property}
        isOpen={showExternalTool}
        onClose={handleToolClose}
      />
    </>
  );
}