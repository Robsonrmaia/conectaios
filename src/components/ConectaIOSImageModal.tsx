import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wand2 } from 'lucide-react';

interface ConectaIOSImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageUrl: string) => void;
  type: 'logo' | 'banner' | 'cover';
}

export function ConectaIOSImageModal({ isOpen, onClose, onImageGenerated, type }: ConectaIOSImageModalProps) {
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
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-muted-foreground">
          💡 Após gerar a imagem, faça o download e faça upload manualmente no editor
        </div>
      </DialogContent>
    </Dialog>
  );
}