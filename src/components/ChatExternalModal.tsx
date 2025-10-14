import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';

interface ChatExternalModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatUrl: string;
}

export function ChatExternalModal({ isOpen, onClose, chatUrl }: ChatExternalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ConectaChat - Mensageria
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full h-full min-h-[90vh]">
          <iframe
            src={chatUrl}
            className="w-full h-full border-0 rounded-lg"
            title="ConectaChat - Sistema de Mensageria"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-top-navigation"
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
