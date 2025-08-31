import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

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

    const url = `${window.location.origin}/imovel/${propertyId}`;
    const text = `Confira este imóvel: ${propertyTitle}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text,
          url
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text} - ${url}`);
        setCopied(true);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao copiar link",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleShare}
      disabled={!canShare}
      className={!canShare ? 'opacity-50 cursor-not-allowed' : ''}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Share2 className="h-4 w-4 mr-2" />
      )}
      {copied ? 'Copiado!' : 'Compartilhar'}
    </Button>
  );
}