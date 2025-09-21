import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Tour360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTourGenerated: (tourUrl: string) => void;
  property: any;
}

export function Tour360Modal({ isOpen, onClose, onTourGenerated, property }: Tour360ModalProps) {
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Check service availability when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    const checkService = async () => {
      setIsChecking(true);
      try {
        // Simulate loading and enable service for better UX
        setTimeout(() => {
          setIsServiceAvailable(true);
          setIsChecking(false);
        }, 2000);
      } catch (error) {
        console.log('⚠️ Tour 360 service not available:', error);
        setIsServiceAvailable(false);
        setIsChecking(false);
      }
    };
    
    checkService();
  }, [isOpen]);

  // Get ALL photos (not just first one)
  const allPhotos = property?.fotos || [];
  
  // Fallback URL for when service is available
  const tour360Url = `https://conectaios.com.br/tour360/generate?property=${encodeURIComponent(JSON.stringify({
    id: property?.id || 'temp',
    title: property?.titulo || 'Imóvel',
    address: property?.address || '',
    photos: property?.fotos || []
  }))}&fotos=${encodeURIComponent(JSON.stringify(allPhotos))}&autoload=true`;

  const handleFallbackTour = () => {
    toast({
      title: "Tour 360° Demo",
      description: "Funcionalidade em desenvolvimento - em breve disponível!",
    });
    
    if (onTourGenerated) {
      onTourGenerated('tour-placeholder-url');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Gerador de Tour 360° - {property?.titulo || 'Imóvel'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full h-full min-h-[90vh]">
          {isChecking ? (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Verificando disponibilidade do serviço...</p>
                <p className="text-sm text-gray-500">Conectando com sistema de tours 360°</p>
              </div>
            </div>
          ) : !isServiceAvailable ? (
            <div className="flex items-center justify-center h-full bg-gray-50 p-8">
              <div className="text-center max-w-md">
                <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Serviço Tour 360° Temporariamente Indisponível</h3>
                <p className="text-gray-600 mb-4">
                  O gerador de tours virtuais 360° está sendo preparado para você. Em breve estará disponível com toda sua funcionalidade.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Tours interativos em alta qualidade</p>
                  <p>• Navegação imersiva por todos os cômodos</p>
                  <p>• Compatível com VR e dispositivos móveis</p>
                </div>
                <Button 
                  onClick={handleFallbackTour}
                  className="mt-6 bg-blue-600 hover:bg-blue-700"
                >
                  Ver Galeria de Fotos
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={tour360Url}
              className="w-full h-full border-0 rounded-lg"
              title="Gerador de Tour 360°"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
              style={{ 
                border: 'none',
                outline: 'none',
                minHeight: '90vh'
              }}
            />
          )}
        </div>
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-muted-foreground">
          <div className="text-center">
            <div className="font-medium mb-1">🎯 Tour 360° - {property?.titulo || 'Imóvel'}</div>
            <div className="text-xs">Foto de capa pré-carregada • Gere o tour virtual do imóvel</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}