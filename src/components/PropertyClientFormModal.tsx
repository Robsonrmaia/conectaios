import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Copy, MessageSquare, Mail } from 'lucide-react';

interface PropertyClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
  };
  brokerId: string;
}

export function PropertyClientFormModal({ isOpen, onClose, property, brokerId }: PropertyClientFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateForm = async () => {
    if (!clientName.trim()) {
      toast.error('Por favor, informe o nome do cliente');
      return;
    }

    setLoading(true);
    try {
      // Generate submission token via edge function
      const { data, error } = await supabase.functions.invoke('generate-submission-token', {
        body: {
          broker_id: brokerId,
          property_id: property.id,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone
        }
      });

      if (error) throw error;

      const formUrl = `${window.location.origin}/formulario-imovel/${data.token}`;
      setGeneratedLink(formUrl);

      toast.success('Formulário gerado com sucesso!');
    } catch (error) {
      console.error('Error generating form:', error);
      toast.error('Erro ao gerar formulário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleSendWhatsApp = () => {
    const message = customMessage || 
      `Olá ${clientName}! Gostaria de compartilhar com você o formulário de avaliação do imóvel "${property.title}". Por favor, preencha com suas informações: ${generatedLink}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = clientPhone 
      ? `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Formulário de Avaliação - ${property.title}`);
    const body = encodeURIComponent(
      customMessage || 
      `Olá ${clientName}!\n\nGostaria de compartilhar com você o formulário de avaliação do imóvel "${property.title}".\n\nPor favor, preencha com suas informações:\n${generatedLink}\n\nAtenciosamente.`
    );
    
    const emailUrl = clientEmail 
      ? `mailto:${clientEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    
    window.location.href = emailUrl;
  };

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setCustomMessage('');
    setGeneratedLink('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Formulário ao Cliente
          </DialogTitle>
          <DialogDescription>
            Gere um formulário personalizado para o cliente avaliar: {property.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email (opcional)</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="joao@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone (opcional)</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateForm}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Gerando...' : 'Gerar Formulário'}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Link do Formulário</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copiar link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customMessage">Mensagem Personalizada (opcional)</Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`Olá ${clientName}! Gostaria de compartilhar com você o formulário de avaliação do imóvel "${property.title}"...`}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendWhatsApp}
                  className="flex-1"
                  variant="default"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  onClick={handleSendEmail}
                  className="flex-1"
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Novo Formulário
                </Button>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Fechar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}