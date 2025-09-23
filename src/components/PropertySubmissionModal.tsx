import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';
import { useWhatsAppMessage } from '@/hooks/useWhatsAppMessage';
import { 
  Copy, 
  MessageCircle, 
  Share2,
  Loader2 
} from 'lucide-react';

interface PropertySubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertySubmissionModal({ open, onOpenChange }: PropertySubmissionModalProps) {
  const { broker } = useBroker();
  const { shareToWhatsApp } = useWhatsAppMessage();
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  const generateSubmissionLink = async () => {
    if (!broker?.id) {
      toast.error('Erro: dados do corretor não encontrados');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-submission-token', {
        body: { broker_id: broker.id }
      });

      if (error) {
        console.error('Error generating token:', error);
        toast.error('Erro ao gerar link de submissão');
        return;
      }

      const publicUrl = data.public_url;
      setGeneratedLink(publicUrl);
      
      toast.success('Link gerado com sucesso!');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao gerar link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copiado para a área de transferência!');
  };

  const sendViaWhatsApp = () => {
    const message = `Olá${ownerName ? ` ${ownerName}` : ''}! 🏡

Para cadastrar seu imóvel de forma rápida e segura, preencha este formulário:

${generatedLink}

É simples e demora apenas alguns minutos. Após o envio, analisarei seu imóvel e entraremos em contato!

Qualquer dúvida, estou à disposição! 😊`;

    shareToWhatsApp(message, ownerPhone);
  };

  const handleReset = () => {
    setGeneratedLink('');
    setOwnerName('');
    setOwnerPhone('');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Formulário para Proprietário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedLink ? (
            <>
              {/* Owner Info Form */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ownerName">Nome do Proprietário (opcional)</Label>
                  <Input
                    id="ownerName"
                    placeholder="Ex: João Silva"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ownerPhone">Telefone/WhatsApp (opcional)</Label>
                  <Input
                    id="ownerPhone"
                    placeholder="Ex: (11) 99999-9999"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateSubmissionLink} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Link...
                  </>
                ) : (
                  'Gerar Link do Formulário'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Generated Link Display */}
              <div className="space-y-3">
                <Label>Link do Formulário Gerado:</Label>
                <div className="p-3 bg-muted rounded-md text-sm break-all">
                  {generatedLink}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>

                <Button
                  onClick={sendViaWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              {/* Reset Button */}
              <Button
                variant="ghost"
                onClick={handleReset}
                className="w-full"
              >
                Gerar Novo Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}