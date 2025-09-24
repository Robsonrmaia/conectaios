import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, Download, Copy, Loader } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PropertyShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
}

export function PropertyShareDialog({ isOpen, onClose, property }: PropertyShareDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const generateShareUrl = async () => {
    setIsGenerating(true);
    
    // Simulate generation process
    setTimeout(() => {
      const url = `https://conectaios.com.br/imovel/${property.id}?share=true`;
      setShareUrl(url);
      setIsGenerating(false);
      
      toast({
        title: "Link gerado!",
        description: "Link de compartilhamento criado com sucesso",
      });
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Enviar Página de Proposta
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium">{property?.titulo}</h3>
            <p className="text-sm text-muted-foreground">
              Gere um link único da página de proposta para enviar ao seu cliente
            </p>
          </div>

          {!shareUrl && !isGenerating && (
            <Button 
              onClick={generateShareUrl}
              className="w-full"
            >
              <Share className="h-4 w-4 mr-2" />
              Gerar Página de Proposta
            </Button>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Preparando página de proposta para seu cliente...
                </p>
              </div>
            </div>
          )}

          {shareUrl && !isGenerating && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-mono break-all">{shareUrl}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button variant="outline" onClick={() => window.open(shareUrl, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}