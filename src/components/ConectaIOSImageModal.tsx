import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wand2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface ConectaIOSImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageUrl: string) => void;
  type: 'logo' | 'banner' | 'cover';
}

export function ConectaIOSImageModal({ isOpen, onClose, onImageGenerated, type }: ConectaIOSImageModalProps) {
  // Show toast when modal opens
  useEffect(() => {
    if (isOpen) {
      const typeLabel = type === 'logo' ? 'Logo' : type === 'banner' ? 'Banner' : 'Capa';
      toast({
        title: "ConectAIOS Imagens",
        description: `Gerador de ${typeLabel} carregado. Após gerar, faça download e upload manualmente.`,
        duration: 5000,
      });
    }
  }, [isOpen, type]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            ConectAIOS - Gerar {type === 'logo' ? 'Logo' : type === 'banner' ? 'Banner' : 'Capa'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full h-full min-h-[90vh]">
          <iframe
            src="https://imagens-conectaios-420832656535.us-west1.run.app"
            className="w-full h-full border-0 rounded-lg"
            title="ConectAIOS Image Generator"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            style={{ 
              border: 'none',
              outline: 'none',
              minHeight: '90vh'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}