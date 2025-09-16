import { useState } from 'react';
import { Share2, ExternalLink, ChevronDown, MessageCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { generatePropertyUrl } from '@/lib/urls';
import { PropertyPresentation } from '@/components/PropertyPresentation';
import { useWhatsAppMessage } from '@/hooks/useWhatsAppMessage';
import { useBroker } from '@/hooks/useBroker';

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
  const { broker } = useBroker();
  const { generatePropertyMessage, shareToWhatsApp, copyMessageToClipboard } = useWhatsAppMessage();
  const [showExternalTool, setShowExternalTool] = useState(false);
  
  // Permite visualização para usuários autenticados, mas restringe ações de proprietário
  const canShare = !!user; // Usuários autenticados podem visualizar
  const canOwnerActions = isOwner || isAuthorized || (user?.id === property.user_id);

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
    if (!canOwnerActions) {
      toast({
        title: "Acesso negado",
        description: "Apenas o corretor responsável pode compartilhar este imóvel",
        variant: "destructive",
      });
      return;
    }

    // Open property detail page in new tab
    const propertyUrl = generatePropertyUrl(property.id);
    window.open(propertyUrl, '_blank', 'noopener,noreferrer');

    toast({
      title: "Abrindo apresentação",
      description: "Página do imóvel aberta em nova aba",
    });
  };

  const handleShareWhatsApp = async () => {
    if (!canOwnerActions) {
      toast({
        title: "Acesso negado",
        description: "Apenas o corretor responsável pode compartilhar este imóvel",
        variant: "destructive",
      });
      return;
    }

    const propertyUrl = generatePropertyUrl(property.id);
    const message = generatePropertyMessage(property, propertyUrl);
    shareToWhatsApp(message, broker?.phone);
  };

  const handleCopyMessage = async () => {
    if (!canOwnerActions) {
      toast({
        title: "Acesso negado",
        description: "Apenas o corretor responsável pode compartilhar este imóvel",
        variant: "destructive",
      });
      return;
    }

    const propertyUrl = generatePropertyUrl(property.id);
    const message = generatePropertyMessage(property, propertyUrl);
    
    try {
      await copyMessageToClipboard(message);
      toast({
        title: "Mensagem copiada!",
        description: "A mensagem formatada foi copiada para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a mensagem",
        variant: "destructive",
      });
    }
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
            Prop
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleShareModal}>
            <Share2 className="h-4 w-4 mr-2" />
            Visualizar Proposta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareWhatsApp}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Compartilhar WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyMessage}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Mensagem
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