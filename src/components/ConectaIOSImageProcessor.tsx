import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wand2, Sparkles, Palette } from 'lucide-react';

interface ConectaIOSImageProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  onImageProcessed: (imageUrl: string) => void;
  type: 'enhance' | 'staging' | 'logo' | 'banner' | 'cover' | 'sketch';
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(`🎨 ConectAIOS: ${message}`);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const getTitle = () => {
    switch (type) {
      case 'enhance': return 'Melhorar Qualidade com IA';
      case 'staging': return 'Colocar Móveis (Virtual Staging)';
      case 'logo': return 'Gerar Logo com IA';
      case 'banner': return 'Gerar Banner com IA';
      case 'cover': return 'Gerar Capa com IA';
      case 'sketch': return 'Esboço a Lápis';
      default: return 'ConectAIOS - Processamento de Imagens';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'enhance': return <Sparkles className="h-5 w-5" />;
      case 'staging': return <Wand2 className="h-5 w-5" />;
      case 'sketch': return <Palette className="h-5 w-5" />;
      case 'logo':
      case 'banner':
      case 'cover': return <Palette className="h-5 w-5" />;
      default: return <Wand2 className="h-5 w-5" />;
    }
  };

  const handleMessage = (event: MessageEvent) => {
    addDebugInfo(`Message received from ${event.origin}`);
    addDebugInfo(`Message data: ${JSON.stringify(event.data).substring(0, 100)}...`);
    
    if (event.origin !== 'https://imagens-conectaios-420832656535.us-west1.run.app') {
      addDebugInfo('❌ Invalid origin rejected');
      return;
    }

    // Support multiple message formats
    if ((event.data.type === 'imageGenerated' || event.data.type === 'imageProcessed') && event.data.imageUrl) {
      addDebugInfo('✅ Image processed successfully');
      onImageProcessed(event.data.imageUrl);
      onClose();
    } else if (event.data.originalUrl && event.data.processedUrl) {
      addDebugInfo('✅ Image processed (alternative format)');
      onImageProcessed(event.data.processedUrl);
      onClose();
    } else if (event.data.success && event.data.result) {
      addDebugInfo('✅ Image processed (result format)');
      onImageProcessed(event.data.result);
      onClose();
    } else {
      addDebugInfo('❓ Unknown message format');
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('🎧 Adding message listener for ConectAIOS');
      
      // Test service availability when opening
      fetch('https://imagens-conectaios-420832656535.us-west1.run.app')
        .then(response => {
          console.log('🌐 ConectAIOS service status:', response.status);
        })
        .catch(error => {
          console.error('🚫 ConectAIOS service not available:', error);
        });
        
      window.addEventListener('message', handleMessage);
      return () => {
        console.log('🔇 Removing message listener for ConectAIOS');
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
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-muted-foreground max-w-md">
          <div className="text-center mb-1">
            💡 {type === 'enhance' || type === 'staging' || type === 'sketch'
              ? 'Após processar a imagem, ela será automaticamente aplicada'
              : 'Após gerar a imagem, faça o download e faça upload manualmente no editor'
            }
          </div>
          {debugInfo.length > 0 && (
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div className="font-medium">Debug Info:</div>
              {debugInfo.map((info, index) => (
                <div key={index} className="truncate">{info}</div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}