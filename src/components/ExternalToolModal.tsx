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
  showAddressBar?: boolean;
}

export function ExternalToolModal({ 
  isOpen, 
  onClose, 
  toolUrl, 
  toolName, 
  toolIcon: IconComponent,
  propertyData,
  showAddressBar = true 
}: ExternalToolModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen || !propertyData || !iframeRef.current) return;

    const handleIframeLoad = () => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      // Send data via multiple methods after ensuring iframe is ready
      setTimeout(() => {
        try {
          console.log('🚀 Sending property data to external tool:', propertyData);
          
          // Method 1: Try FILL_PROPERTY_FORM (standard)
          iframe.contentWindow?.postMessage({
            type: 'FILL_PROPERTY_FORM',
            data: propertyData
          }, '*');
          
          // Method 2: Try PROPERTY_DATA (fallback)
          iframe.contentWindow?.postMessage({
            type: 'PROPERTY_DATA',
            data: propertyData
          }, '*');
          
          // Method 3: Try property-data (lowercase)
          iframe.contentWindow?.postMessage({
            type: 'property-data',
            payload: propertyData
          }, '*');
          
          // Method 4: Try direct data send
          iframe.contentWindow?.postMessage(propertyData, '*');
          
          console.log('✅ All postMessage methods attempted');
        } catch (error) {
          console.error('❌ Error sending postMessage:', error);
        }
      }, 2000); // Increased delay to ensure iframe is fully loaded
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => iframe.removeEventListener('load', handleIframeLoad);
    }
  }, [isOpen, propertyData]);

  useEffect(() => {
    // Periodic data sending with multiple localStorage keys
    if (!isOpen || !propertyData) return;

    // Save to multiple localStorage keys
    localStorage.setItem('propertyFormData', JSON.stringify(propertyData));
    localStorage.setItem('property-data', JSON.stringify(propertyData));
    localStorage.setItem('formData', JSON.stringify(propertyData));
    localStorage.setItem('propertyData', JSON.stringify(propertyData));
    
    console.log('💾 Property data saved to localStorage with multiple keys');

    const interval = setInterval(() => {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        try {
          // Try all communication methods periodically
          iframe.contentWindow.postMessage({
            type: 'FILL_PROPERTY_FORM',
            data: propertyData
          }, '*');
          
          iframe.contentWindow.postMessage({
            type: 'PROPERTY_DATA',
            data: propertyData
          }, '*');
        } catch (error) {
          // Ignore errors, iframe might not be ready
        }
      }
    }, 3000);

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
            sandbox={showAddressBar 
              ? "allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-top-navigation allow-presentation" 
              : "allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            }
            style={{ 
              border: 'none',
              outline: 'none',
              minHeight: '90vh',
              ...(showAddressBar ? {} : { 
                position: 'relative',
                overflow: 'hidden'
              })
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