import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';

interface Property {
  id: string;
  titulo: string;
  valor: number;
}

interface Client {
  id: string;
  nome: string;
  telefone: string;
}

interface Broker {
  id: string;
  name: string;
  email: string;
}

interface CreateDealDialogProps {
  propertyId?: string;
  onDealCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateDealDialog({ propertyId, onDealCreated, open: controlledOpen, onOpenChange }: CreateDealDialogProps) {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  
  const [formData, setFormData] = useState({
    property_id: propertyId || '',
    client_id: '',
    offer_amount: '',
    seller_broker_id: '',
    listing_broker_id: '',
    buyer_commission: 50,
    seller_commission: 50,
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      // Fetch properties
      const { data: propertiesData } = await supabase
        .from('imoveis') // Use imoveis instead of properties
        .select('id, title, price') // Use title and price instead of titulo/valor
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (propertiesData) {
        setProperties(propertiesData.map(item => ({
          id: item.id,
          titulo: item.title, // Map title to titulo for compatibility
          valor: item.price || 0 // Map price to valor for compatibility
        })) as Property[]);
      }

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, nome, telefone')
        .eq('user_id', user?.id)
        .order('nome');

      setClients(clientsData || []);

      // Fetch brokers (excluding current user)
      const { data: brokersData } = await supabase
        .from('conectaios_brokers')
        .select('id, name, email')
        .neq('user_id', user?.id)
        .eq('status', 'active')
        .order('name');

      setBrokers(brokersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker?.id) return;

    setLoading(true);
    try {
      // Validate commission split
      if (formData.buyer_commission + formData.seller_commission !== 100) {
        toast({
          title: "Erro",
          description: "A soma das comissões deve ser 100%",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          property_id: formData.property_id,
          client_id: formData.client_id || null,
          offer_amount: parseFloat(formData.offer_amount),
          status: 'proposal',
          notes: formData.notes || null
        });

      if (error) throw error;

      toast({
        title: "Deal criado!",
        description: "Deal criado com sucesso",
      });

      // Reset form
      setFormData({
        property_id: propertyId || '',
        client_id: '',
        offer_amount: '',
        seller_broker_id: '',
        listing_broker_id: '',
        buyer_commission: 50,
        seller_commission: 50,
        notes: ''
      });

      setOpen(false);
      onDealCreated?.();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar deal",
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
          <DialogDescription>
            Crie um novo deal para negociar um imóvel com outros corretores
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="property">Imóvel *</Label>
              <Select 
                value={formData.property_id} 
                onValueChange={(value) => setFormData({...formData, property_id: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um imóvel" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.titulo} - R$ {property.valor.toLocaleString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => setFormData({...formData, client_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome} - {client.telefone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="offer_amount">Valor da Proposta *</Label>
            <Input
              id="offer_amount"
              type="number"
              value={formData.offer_amount}
              onChange={(e) => setFormData({...formData, offer_amount: e.target.value})}
              placeholder="0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seller_broker">Corretor Vendedor</Label>
              <Select 
                value={formData.seller_broker_id} 
                onValueChange={(value) => setFormData({...formData, seller_broker_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.name} - {broker.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="listing_broker">Corretor de Listagem</Label>
              <Select 
                value={formData.listing_broker_id} 
                onValueChange={(value) => setFormData({...formData, listing_broker_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.name} - {broker.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Split de Comissão (%)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyer_commission">Corretor Comprador</Label>
                <Input
                  id="buyer_commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.buyer_commission}
                  onChange={(e) => setFormData({
                    ...formData, 
                    buyer_commission: parseInt(e.target.value) || 0,
                    seller_commission: 100 - (parseInt(e.target.value) || 0)
                  })}
                />
              </div>
              <div>
                <Label htmlFor="seller_commission">Corretor Vendedor</Label>
                <Input
                  id="seller_commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.seller_commission}
                  onChange={(e) => setFormData({
                    ...formData, 
                    seller_commission: parseInt(e.target.value) || 0,
                    buyer_commission: 100 - (parseInt(e.target.value) || 0)
                  })}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Total: {formData.buyer_commission + formData.seller_commission}% 
              {formData.buyer_commission + formData.seller_commission !== 100 && 
                <span className="text-destructive"> (deve somar 100%)</span>
              }
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Observações sobre o deal..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Criando...' : 'Criar Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}