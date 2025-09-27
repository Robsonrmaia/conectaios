import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CRM, Properties, imovelToProperty, type Property, type Client, type Deal } from '@/data';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealCreated?: () => void;
}

export function CreateDealDialog({ open, onOpenChange, onDealCreated }: CreateDealDialogProps) {
  const { user } = useAuth();
  const { broker } = useBroker();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    property_id: '',
    client_id: '',
    offer_amount: 0,
    status: 'lead',
    user_id: user?.id || ''
  });

  useEffect(() => {
    if (open && user) {
      fetchData();
    }
  }, [open, user]);

  const fetchData = async () => {
    try {
      // Fetch all data using unified data layer
      const [imoveis, crmClients, crmBrokers] = await Promise.all([
        Properties.list(),
        CRM.clients.listLegacy(), 
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
        user_id: b.user_id
      }));
      setBrokers(transformedBrokers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker?.id) return;

    setLoading(true);
    try {
      const deal = await CRM.deals.create({
        client_id: formData.client_id,
        property_id: formData.property_id,
        offer_amount: formData.offer_amount,
        status: formData.status,
        user_id: formData.user_id,
        commission_amount: 0,
        notes: ''
      });

      if (!deal) throw new Error('Failed to create deal');

      toast({
        title: "Sucesso",
        description: "Negócio criado com sucesso",
      });

      onDealCreated?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        property_id: '',
        client_id: '',
        offer_amount: 0,
        status: 'lead',
        user_id: user?.id || ''
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar negócio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Negócio</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="property">Imóvel</Label>
            <Select 
              value={formData.property_id} 
              onValueChange={(value) => setFormData({ ...formData, property_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um imóvel" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - R$ {property.price?.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="client">Cliente</Label>
            <Select 
              value={formData.client_id} 
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="offer_amount">Valor da Proposta</Label>
            <Input
              id="offer_amount"
              type="number"
              value={formData.offer_amount}
              onChange={(e) => setFormData({ ...formData, offer_amount: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Negócio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}