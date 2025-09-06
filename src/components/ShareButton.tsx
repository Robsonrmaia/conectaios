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
      className={`h-7 w-full p-0 hover:bg-primary hover:text-white ${!canShare ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Compartilhar"
    >
      {copied ? (
        <Check className="h-3 w-3" />
      ) : (
        <Share2 className="h-3 w-3" />
      )}
      <span className="sr-only">{copied ? 'Copiado!' : 'Compartilhar'}</span>
    </Button>
  );
}