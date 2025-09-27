import React, { useState, useEffect } from 'react';
import { Properties, CRM, Property, Client, Deal } from '@/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface Broker {
  id: string;
  name: string;
  email: string;
  user_id: string;
  status: string;
}

interface CreateDealDialogProps {
  propertyId?: string;
  onDealCreated?: (deal: any) => void;
}

export function CreateDealDialog({ propertyId, onDealCreated }: CreateDealDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  
  const [formData, setFormData] = useState({
    propertyId: propertyId || '',
    clientId: '',
    offerAmount: '',
    associatedBrokers: [] as string[],
    commissionSplit: '',
    notes: ''
  });

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch all data using unified data layer
      const [imoveis, crmClients, crmBrokers] = await Promise.all([
        Properties.list(),
        CRM.clients.listAsLegacy(), 
        CRM.brokers.list()
      ]);

        const transformedProperties = imoveis.map(imovel => imovelToProperty(imovel));
      setProperties(transformedProperties);
      setClients(crmClients);
      
      // Transform brokers to expected format
      const transformedBrokers = crmBrokers.map(b => ({
        id: b.id,
        name: b.user_id, // Will need profile join for real name
        email: '', // Will need profile join for real email
        user_id: b.user_id,
        status: 'active'
      }));
      setBrokers(transformedBrokers);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.propertyId) {
      toast({
        title: "Erro",
        description: "Cliente e propriedade são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newDeal = await CRM.deals.create({
        client_id: formData.clientId,
        property_id: formData.propertyId,
        offer_amount: parseFloat(formData.offerAmount) || 0,
        status: 'negotiating',
        user_id: 'current-user' // Replace with actual user ID
      });

      toast({
        title: "Sucesso",
        description: "Deal criado com sucesso",
      });

      onDealCreated?.(newDeal);
      setOpen(false);
      setFormData({
        propertyId: propertyId || '',
        clientId: '',
        offerAmount: '',
        associatedBrokers: [],
        commissionSplit: '',
        notes: ''
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar deal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Deal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Propriedade</Label>
              <Select 
                value={formData.propertyId} 
                onValueChange={(value) => setFormData({...formData, propertyId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a propriedade" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cliente</Label>
              <Select 
                value={formData.clientId} 
                onValueChange={(value) => setFormData({...formData, clientId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Valor da Oferta (R$)</Label>
            <Input
              type="number"
              value={formData.offerAmount}
              onChange={(e) => setFormData({...formData, offerAmount: e.target.value})}
              placeholder="500000"
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Detalhes adicionais sobre o deal..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Deal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}