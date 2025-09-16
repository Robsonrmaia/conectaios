import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface ExternalToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolUrl: string;
  toolName: string;
  toolIcon?: React.ComponentType<{ className?: string }>;
  propertyData?: any;
}

export function ExternalToolModal({ 
  isOpen, 
  onClose, 
  toolUrl, 
  toolName, 
  toolIcon: IconComponent,
  propertyData 
}: ExternalToolModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen || !propertyData || !iframeRef.current) return;

    const handleIframeLoad = () => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      // Send data via postMessage after a short delay to ensure iframe is ready
      setTimeout(() => {
        try {
          console.log('Sending property data via postMessage:', propertyData);
          iframe.contentWindow?.postMessage({
            type: 'PROPERTY_DATA',
            data: propertyData
          }, '*');
        } catch (error) {
          console.error('Error sending postMessage:', error);
        }
      }, 1000);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, [isOpen, propertyData]);

  useEffect(() => {
    // Also try sending data periodically in case iframe loads later
    if (!isOpen || !propertyData) return;

    const interval = setInterval(() => {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.postMessage({
            type: 'PROPERTY_DATA',
            data: propertyData
          }, '*');
        } catch (error) {
          // Ignore errors, iframe might not be ready
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, propertyData]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-5 w-5" />}
            {toolName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full h-full min-h-[90vh]">
          <iframe
            ref={iframeRef}
            src={toolUrl}
            className="w-full h-full border-0 rounded-lg"
            title={toolName}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-top-navigation"
            style={{ 
              border: 'none',
              outline: 'none',
              minHeight: '90vh'
            }}
          />
        </div>
        
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Ferramenta externa integrada - {toolName}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}