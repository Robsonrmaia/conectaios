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
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [hasTimeout, setHasTimeout] = useState(false);

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
    addDebugInfo(`📨 Message from: ${event.origin}`);
    addDebugInfo(`📋 Full data: ${JSON.stringify(event.data)}`);
    
    if (event.origin !== 'https://imagens-conectaios-420832656535.us-west1.run.app') {
      addDebugInfo('❌ Invalid origin rejected');
      return;
    }

    // Enhanced support for multiple message formats
    const data = event.data;
    
    // Format 1: Standard imageGenerated/imageProcessed with imageUrl
    if ((data.type === 'imageGenerated' || data.type === 'imageProcessed') && data.imageUrl) {
      addDebugInfo('✅ Format 1: Standard image URL');
      onImageProcessed(data.imageUrl);
      onClose();
      return;
    }
    
    // Format 2: originalUrl + processedUrl
    if (data.originalUrl && data.processedUrl) {
      addDebugInfo('✅ Format 2: Processed URL');
      onImageProcessed(data.processedUrl);
      onClose();
      return;
    }
    
    // Format 3: success + result
    if (data.success && data.result) {
      addDebugInfo('✅ Format 3: Success result');
      onImageProcessed(data.result);
      onClose();
      return;
    }
    
    // Format 4: Direct URL string
    if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('data:'))) {
      addDebugInfo('✅ Format 4: Direct URL string');
      onImageProcessed(data);
      onClose();
      return;
    }
    
    // Format 5: url property
    if (data.url) {
      addDebugInfo('✅ Format 5: URL property');
      onImageProcessed(data.url);
      onClose();
      return;
    }
    
    // Format 6: image property
    if (data.image) {
      addDebugInfo('✅ Format 6: Image property');
      onImageProcessed(data.image);
      onClose();
      return;
    }
    
    // Format 7: downloadUrl (for sketch generation)
    if (data.downloadUrl || data.download_url) {
      addDebugInfo('✅ Format 7: Download URL');
      onImageProcessed(data.downloadUrl || data.download_url);
      onClose();
      return;
    }
    
    // Format 8: Check for nested data
    if (data.data && data.data.url) {
      addDebugInfo('✅ Format 8: Nested URL');
      onImageProcessed(data.data.url);
      onClose();
      return;
    }
    
    addDebugInfo(`❓ Unknown format - Keys: ${Object.keys(data).join(', ')}`);
    addDebugInfo('⚠️ Aguardando 3s para possível retry...');
  };

  useEffect(() => {
    if (isOpen) {
      console.log('🎧 Adding message listener for ConectAIOS');
      addDebugInfo('🔄 Initializing communication...');
      
      // Test service availability when opening
      fetch('https://imagens-conectaios-420832656535.us-west1.run.app', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      })
        .then(response => {
          console.log('🌐 ConectAIOS service status:', response.status);
          addDebugInfo(`🌐 Service status: ${response.status}`);
          setServiceAvailable(true);
        })
        .catch(error => {
          console.error('🚫 ConectAIOS service not available:', error);
          addDebugInfo('🚫 Service connection failed - check internet');
          setServiceAvailable(false);
        });
        
      window.addEventListener('message', handleMessage);
      
      // Auto-close fallback after 2 minutes if no response
      const timeout = setTimeout(() => {
        addDebugInfo('⏰ Timeout after 2 minutes - service may be unavailable');
        setHasTimeout(true);
        setServiceAvailable(false);
      }, 120000);
      
      return () => {
        console.log('🔇 Removing message listener for ConectAIOS');
        window.removeEventListener('message', handleMessage);
        clearTimeout(timeout);
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
        
        <div className="w-full h-full min-h-[90vh] relative">
          {!serviceAvailable && hasTimeout && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
              <div className="text-center p-6 max-w-md">
                <div className="mb-4 text-destructive">⚠️ Serviço Indisponível</div>
                <p className="text-sm text-muted-foreground mb-4">
                  O serviço de processamento de imagens não está respondendo. 
                  Isso pode ser devido a manutenção ou problemas de conectividade.
                </p>
                <Button onClick={onClose} variant="outline">
                  Fechar e Tentar Mais Tarde
                </Button>
              </div>
            </div>
          )}
          
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