import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [showExternalTool, setShowExternalTool] = useState(false);

  const handleShareModal = () => {
    setShowExternalTool(true);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleShareModal}
        className="h-8 text-xs hover:bg-primary hover:text-white"
        title="Gerar Proposta"
      >
        <Share2 className="h-3 w-3 mr-1" />
        Proposta
      </Button>

      <PropertyPresentation
        property={property}
        isOpen={showExternalTool}
        onClose={() => setShowExternalTool(false)}
      />
    </>
  );
}