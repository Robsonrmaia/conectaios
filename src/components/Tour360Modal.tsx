import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface Tour360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTourGenerated: (tourUrl: string) => void;
  property: any;
}

export function Tour360Modal({ isOpen, onClose, onTourGenerated, property }: Tour360ModalProps) {
  // Get ALL photos (not just first one)
  const allPhotos = property?.fotos || [];
  
  // Build URL for the Tour 360 generator with ALL property data and ALL photos pre-loaded
  const tour360Url = `https://imagens-conectaios-420832656535.us-west1.run.app?` +
    `action=tour360&` +
    `propertyId=${encodeURIComponent(property?.id || '')}&` +
    `titulo=${encodeURIComponent(property?.titulo || '')}&` +
    `valor=${encodeURIComponent(property?.valor?.toString() || '')}&` +
    `area=${encodeURIComponent(property?.area?.toString() || '')}&` +
    `quartos=${encodeURIComponent(property?.quartos?.toString() || '')}&` +
    `bathrooms=${encodeURIComponent(property?.bathrooms?.toString() || '')}&` +
    `parking_spots=${encodeURIComponent(property?.parking_spots?.toString() || '')}&` +
    `tipo=${encodeURIComponent(property?.property_type || '')}&` +
    `finalidade=${encodeURIComponent(property?.listing_type || '')}&` +
    `descricao=${encodeURIComponent(property?.descricao || '')}&` +
    `fotos=${encodeURIComponent(JSON.stringify(allPhotos))}&` +
    `autoload=true`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Gerador de Tour 360° - {property?.titulo}
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full h-full min-h-[90vh]">
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
        </div>
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-muted-foreground">
          <div className="text-center">
            <div className="font-medium mb-1">🎯 Tour 360° - {property?.titulo}</div>
            <div className="text-xs">Foto de capa pré-carregada • Gere o tour virtual do imóvel</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}