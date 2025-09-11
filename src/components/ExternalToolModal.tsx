import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';

interface ExternalToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolUrl: string;
  toolName: string;
  toolIcon?: React.ComponentType<{ className?: string }>;
}

export function ExternalToolModal({ 
  isOpen, 
  onClose, 
  toolUrl, 
  toolName, 
  toolIcon: IconComponent 
}: ExternalToolModalProps) {
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