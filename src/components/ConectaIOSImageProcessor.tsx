import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wand2, Sparkles, Palette } from 'lucide-react';

interface ConectaIOSImageProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  onImageProcessed: (imageUrl: string) => void;
  type: 'enhance' | 'staging' | 'logo' | 'banner' | 'cover';
  initialImage?: string;
}

export function ConectaIOSImageProcessor({ 
  isOpen, 
  onClose, 
  onImageProcessed, 
  type, 
  initialImage 
}: ConectaIOSImageProcessorProps) {
  const [processing, setProcessing] = useState(false);

  const getTitle = () => {
    switch (type) {
      case 'enhance': return 'Melhorar Qualidade com IA';
      case 'staging': return 'Colocar Móveis (Virtual Staging)';
      case 'logo': return 'Gerar Logo com IA';
      case 'banner': return 'Gerar Banner com IA';
      case 'cover': return 'Gerar Capa com IA';
      default: return 'ConectAIOS - Processamento de Imagens';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'enhance': return <Sparkles className="h-5 w-5" />;
      case 'staging': return <Wand2 className="h-5 w-5" />;
      case 'logo':
      case 'banner':
      case 'cover': return <Palette className="h-5 w-5" />;
      default: return <Wand2 className="h-5 w-5" />;
    }
  };

  const handleMessage = (event: MessageEvent) => {
    console.log('ConectAIOS Message received:', event);
    
    if (event.origin !== 'https://imagens-conectaios-420832656535.us-west1.run.app') {
      console.log('Invalid origin:', event.origin);
      return;
    }

    console.log('Message data:', event.data);

    // Support both 'imageGenerated' and 'imageProcessed' for compatibility
    if ((event.data.type === 'imageGenerated' || event.data.type === 'imageProcessed') && event.data.imageUrl) {
      console.log('Image processed successfully:', event.data.imageUrl);
      onImageProcessed(event.data.imageUrl);
      onClose();
    } else if (event.data.originalUrl && event.data.processedUrl) {
      // Alternative format support
      console.log('Image processed (alternative format):', event.data.processedUrl);
      onImageProcessed(event.data.processedUrl);
      onClose();
    } else {
      console.log('Unknown message format:', event.data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Adding message listener for ConectAIOS');
      window.addEventListener('message', handleMessage);
      return () => {
        console.log('Removing message listener for ConectAIOS');
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full h-full min-h-[90vh]">
          <iframe
            src={`https://imagens-conectaios-420832656535.us-west1.run.app${initialImage ? `?imageUrl=${encodeURIComponent(initialImage)}&action=${type}` : ''}`}
            className="w-full h-full border-0 rounded-lg"
            title="ConectAIOS Image Processor"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-top-navigation"
            style={{ 
              border: 'none',
              outline: 'none',
              minHeight: '90vh'
            }}
          />
        </div>
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-muted-foreground">
          💡 {type === 'enhance' || type === 'staging' 
            ? 'Após processar a imagem, ela será automaticamente aplicada'
            : 'Após gerar a imagem, faça o download e faça upload manualmente no editor'
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}