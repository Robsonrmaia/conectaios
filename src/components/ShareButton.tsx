import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { generatePropertyUrl } from '@/lib/urls';
import { ExternalToolModal } from '@/components/ExternalToolModal';

interface ShareButtonProps {
  propertyId: string;
  propertyTitle: string;
  ownerUserId?: string;
  isOwner?: boolean;
  isAuthorized?: boolean;
}

export function ShareButton({ 
  propertyId, 
  propertyTitle, 
  ownerUserId, 
  isOwner = false, 
  isAuthorized = false 
}: ShareButtonProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  
  const canShare = isOwner || isAuthorized || (user?.id === ownerUserId);

  const handleShare = async () => {
    if (!canShare) {
      toast({
        title: "Acesso negado",
        description: "Apenas o corretor responsável pode compartilhar este imóvel",
        variant: "destructive",
      });
      return;
    }

    // Open HTML generator modal
    setShowGeneratorModal(true);
  };

  const handleGeneratorClose = () => {
    setShowGeneratorModal(false);
  };

  // Build URL for the HTML generator with property data
  const generatorUrl = `https://gerador-de-proposta-de-im-vel-com-ia-420832656535.us-west1.run.app?propertyId=${encodeURIComponent(propertyId)}&title=${encodeURIComponent(propertyTitle)}&ownerUserId=${encodeURIComponent(ownerUserId || '')}`;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleShare}
        disabled={!canShare}
        className={`h-7 w-full p-0 hover:bg-primary hover:text-white ${!canShare ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Compartilhar"
      >
        <Share2 className="h-3 w-3" />
        <span className="sr-only">Compartilhar</span>
      </Button>

      <ExternalToolModal
        isOpen={showGeneratorModal}
        onClose={handleGeneratorClose}
        toolUrl={generatorUrl}
        toolName="Gerador de Proposta HTML"
        toolIcon={Share2}
      />
    </>
  );
}