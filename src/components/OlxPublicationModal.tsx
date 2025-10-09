import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useBroker } from '@/hooks/useBroker';
import { useNavigate } from 'react-router-dom';
import { Globe, X, Sparkles } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  zipcode?: string;
  state?: string;
  area_total?: number;
  olx_enabled?: boolean;
  olx_data?: {
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    observations?: string;
    zipcode?: string;
    state?: string;
    area_util?: number;
    area_privativa?: number;
  };
}

interface OlxPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSave: (enabled: boolean, olxData: any) => Promise<void>;
  upgradeRequired?: boolean;
}

export function OlxPublicationModal({ isOpen, onClose, property, onSave, upgradeRequired = false }: OlxPublicationModalProps) {
  const { broker } = useBroker();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(property.olx_enabled || false);
  const [formData, setFormData] = useState({
    contact_name: property.olx_data?.contact_name || broker?.name || '',
    contact_phone: property.olx_data?.contact_phone || broker?.phone || '',
    contact_email: property.olx_data?.contact_email || broker?.email || '',
    observations: property.olx_data?.observations || '',
    zipcode: property.olx_data?.zipcode || property.zipcode || '',
    state: property.olx_data?.state || property.state || 'BA',
    area_util: property.olx_data?.area_util || 0,
    area_privativa: property.olx_data?.area_privativa || 0
  });

  useEffect(() => {
    setEnabled(property.olx_enabled || false);
    setFormData({
      contact_name: property.olx_data?.contact_name || broker?.name || '',
      contact_phone: property.olx_data?.contact_phone || broker?.phone || '',
      contact_email: property.olx_data?.contact_email || broker?.email || '',
      observations: property.olx_data?.observations || '',
      zipcode: property.olx_data?.zipcode || property.zipcode || '',
      state: property.olx_data?.state || property.state || 'BA',
      area_util: property.olx_data?.area_util || 0,
      area_privativa: property.olx_data?.area_privativa || 0
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
          {upgradeRequired && (
            <Alert className="border-primary/50 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle>Recurso Premium Necessário</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  A publicação automática no OLX está disponível nos planos <strong>Premium</strong> (2 imóveis) 
                  e <strong>Professional</strong> (5 imóveis).
                </p>
                <Button 
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/perfil');
                  }}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fazer Upgrade do Plano
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
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
            {/* Seção de Endereço */}
            <div className="space-y-3 pb-3 border-b">
              <h3 className="font-medium text-sm">Endereço Completo</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="zipcode">CEP *</Label>
                  <Input
                    id="zipcode"
                    value={formData.zipcode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData({ ...formData, zipcode: value });
                    }}
                    placeholder="00000000"
                    maxLength={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Somente números</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF) *</Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BA">Bahia (BA)</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                      <SelectItem value="SP">São Paulo (SP)</SelectItem>
                      <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção de Áreas */}
            <div className="space-y-3 pb-3 border-b">
              <h3 className="font-medium text-sm">Áreas do Imóvel</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="area_total">Área Total</Label>
                  <Input
                    id="area_total"
                    value={property.area_total || 0}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Cadastrada</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_util">Área Útil (m²) *</Label>
                  <Input
                    id="area_util"
                    type="number"
                    value={formData.area_util || ''}
                    onChange={(e) => setFormData({ ...formData, area_util: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_privativa">Área Privativa (m²) *</Label>
                  <Input
                    id="area_privativa"
                    type="number"
                    value={formData.area_privativa || ''}
                    onChange={(e) => setFormData({ ...formData, area_privativa: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção de Contato */}
            <div className="space-y-3 pb-3 border-b">
              <h3 className="font-medium text-sm">Dados de Contato OLX</h3>
              
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
            </div>

            {/* Observações */}
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
