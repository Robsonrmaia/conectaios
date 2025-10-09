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
import { Globe, X, Sparkles, MapPin, Ruler, User, Info } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  zipcode?: string;
  state?: string;
  area_total?: number;
  olx_enabled?: boolean;
  olx_data?: {
    // Location
    country?: string;
    country_abbr?: string;
    state?: string;
    state_abbr?: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    street_number?: string;
    complement?: string;
    postal_code?: string;
    display_address?: string;
    
    // Details
    living_area?: number;
    lot_area?: number;
    
    // Contact
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    
    // Extras
    observations?: string;
  };
}

interface OlxPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSave: (enabled: boolean, olxData: any) => Promise<void>;
  upgradeRequired?: boolean;
}

const mapStateAbbr = (state?: string): string => {
  const stateMap: { [key: string]: string } = {
    'Bahia': 'BA',
    'Rio de Janeiro': 'RJ',
    'São Paulo': 'SP',
    'Minas Gerais': 'MG'
  };
  return stateMap[state || ''] || state || 'BA';
};

const getStateName = (abbr: string): string => {
  const states: { [key: string]: string } = {
    'BA': 'Bahia',
    'RJ': 'Rio de Janeiro',
    'SP': 'São Paulo',
    'MG': 'Minas Gerais'
  };
  return states[abbr] || abbr;
};

export function OlxPublicationModal({ isOpen, onClose, property, onSave, upgradeRequired = false }: OlxPublicationModalProps) {
  const { broker } = useBroker();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(property.olx_enabled || false);
  const [formData, setFormData] = useState({
    // Location
    country: 'Brasil',
    country_abbr: 'BR',
    state: '',
    state_abbr: '',
    city: '',
    neighborhood: '',
    address: '',
    street_number: '',
    complement: '',
    postal_code: '',
    display_address: 'Street',
    
    // Details
    living_area: 0,
    lot_area: 0,
    
    // Contact
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    
    // Extras
    observations: ''
  });

  useEffect(() => {
    setEnabled(property.olx_enabled || false);
    
    const olx = property.olx_data || {};
    const stateAbbr = olx.state_abbr || mapStateAbbr(property.state) || 'BA';
    
    setFormData({
      country: 'Brasil',
      country_abbr: 'BR',
      state: olx.state || getStateName(stateAbbr),
      state_abbr: stateAbbr,
      city: olx.city || property.city || '',
      neighborhood: olx.neighborhood || property.neighborhood || '',
      address: olx.address || property.address || '',
      street_number: olx.street_number || '',
      complement: olx.complement || '',
      postal_code: olx.postal_code || property.zipcode || '',
      display_address: olx.display_address || 'Street',
      
      living_area: olx.living_area || property.area_total || 0,
      lot_area: olx.lot_area || 0,
      
      contact_name: olx.contact_name || broker?.name || '',
      contact_phone: olx.contact_phone || broker?.phone || '',
      contact_email: olx.contact_email || broker?.email || '',
      
      observations: olx.observations || ''
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configurar Publicação OLX (VRSync)
          </DialogTitle>
          <DialogDescription>
            Configure os dados completos no formato VRSync para OLX, Zap Imóveis e Viva Real.
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

          {/* SEÇÃO 1: LOCALIZAÇÃO COMPLETA */}
          <div className="space-y-3 pb-3 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização Completa (Location)
            </h3>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                A OLX exige endereço <strong>completo</strong>. Todos os campos abaixo são obrigatórios.
              </AlertDescription>
            </Alert>

            {/* Estado e Cidade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="state_abbr">Estado (UF) *</Label>
                <Select 
                  value={formData.state_abbr} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    state_abbr: value,
                    state: getStateName(value)
                  })}
                >
                  <SelectTrigger id="state_abbr">
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

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Salvador, Rio de Janeiro..."
                  required
                />
              </div>
            </div>

            {/* Endereço (Rua) */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço (Rua/Avenida) *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua das Flores, Avenida Brasil..."
                required
              />
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="street_number">Número *</Label>
                <Input
                  id="street_number"
                  value={formData.street_number}
                  onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                  placeholder="123"
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto 45, Bloco B, Casa 2..."
                />
              </div>
            </div>

            {/* Bairro e CEP */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Barra, Copacabana, Jardins..."
                  required
                />
                {property.neighborhood && (
                  <p className="text-xs text-muted-foreground">
                    Cadastrado: {property.neighborhood}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">CEP *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData({ ...formData, postal_code: value });
                  }}
                  placeholder="00000000"
                  maxLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">Somente números (8 dígitos)</p>
              </div>
            </div>

            {/* Nível de exibição do endereço */}
            <div className="space-y-2">
              <Label htmlFor="display_address">Como exibir endereço no anúncio</Label>
              <Select 
                value={formData.display_address} 
                onValueChange={(value) => setFormData({ ...formData, display_address: value })}
              >
                <SelectTrigger id="display_address">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Completo (rua + número)</SelectItem>
                  <SelectItem value="Street">Apenas rua (sem número)</SelectItem>
                  <SelectItem value="Neighborhood">Apenas bairro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SEÇÃO 2: ÁREAS DO IMÓVEL */}
          <div className="space-y-3 pb-3 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Áreas do Imóvel (Details)
            </h3>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                A OLX exige <strong>Área Útil (LivingArea)</strong> para apartamentos/casas.
                Para terrenos, preencha <strong>Área do Terreno (LotArea)</strong>.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="area_total">Área Total</Label>
                <Input
                  id="area_total"
                  value={property.area_total || 0}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Referência</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="living_area">Área Útil (m²) *</Label>
                <Input
                  id="living_area"
                  type="number"
                  value={formData.living_area || ''}
                  onChange={(e) => setFormData({ ...formData, living_area: parseFloat(e.target.value) || 0 })}
                  placeholder="120"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-muted-foreground">Obrigatório</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lot_area">Área Terreno (m²)</Label>
                <Input
                  id="lot_area"
                  type="number"
                  value={formData.lot_area || ''}
                  onChange={(e) => setFormData({ ...formData, lot_area: parseFloat(e.target.value) || 0 })}
                  placeholder="250"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: DADOS DE CONTATO */}
          <div className="space-y-3 pb-3 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Dados de Contato OLX (ContactInfo)
            </h3>
            
            <Alert>
              <AlertDescription className="text-xs">
                Dados pré-preenchidos do seu perfil. Ajuste se necessário.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do Contato *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Nome da Imobiliária ou Corretor"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone *</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(XX) XXXXX-XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">E-mail *</Label>
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
          </div>

          {/* SEÇÃO 4: OBSERVAÇÕES */}
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
