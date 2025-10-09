import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useBroker } from '@/hooks/useBroker';
import { Globe, X } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  olx_enabled?: boolean;
  olx_data?: {
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    observations?: string;
  };
}

interface OlxPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSave: (enabled: boolean, olxData: any) => Promise<void>;
}

export function OlxPublicationModal({ isOpen, onClose, property, onSave }: OlxPublicationModalProps) {
  const { broker } = useBroker();
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(property.olx_enabled || false);
  const [formData, setFormData] = useState({
    contact_name: property.olx_data?.contact_name || broker?.name || '',
    contact_phone: property.olx_data?.contact_phone || broker?.phone || '',
    contact_email: property.olx_data?.contact_email || broker?.email || '',
    observations: property.olx_data?.observations || ''
  });

  useEffect(() => {
    setEnabled(property.olx_enabled || false);
    setFormData({
      contact_name: property.olx_data?.contact_name || broker?.name || '',
      contact_phone: property.olx_data?.contact_phone || broker?.phone || '',
      contact_email: property.olx_data?.contact_email || broker?.email || '',
      observations: property.olx_data?.observations || ''
    });
  }, [property, broker, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(enabled, formData);
      onClose();
    } catch (error) {
      console.error('Error saving OLX data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configurar Publicação OLX
          </DialogTitle>
          <DialogDescription>
            Configure os dados de contato que aparecerão no anúncio do OLX.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between py-3 border-y">
            <div className="space-y-0.5">
              <Label className="text-base">Publicar no OLX</Label>
              <p className="text-sm text-muted-foreground">
                {enabled ? 'Imóvel será incluído no feed OLX' : 'Imóvel não será publicado'}
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do Contato *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Nome para contato no OLX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefone do Contato *</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="(XX) XXXXX-XXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email do Contato *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contato@exemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações Adicionais</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Informações extras para o anúncio OLX..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Globe className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
