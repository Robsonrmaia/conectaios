import { useState } from 'react';
import { Search, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Property {
  id: string;
  title: string;
  reference_code: string | null;
  owner_id: string;
  city: string | null;
  price: number | null;
}

interface Broker {
  id: string;
  user_id: string;
  name: string;
  email: string;
  creci: string | null;
  status: string;
}

export const PropertyTransferAdmin = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedToBroker, setSelectedToBroker] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const searchProperties = async () => {
    if (!searchTerm.trim()) {
      toast.error('Digite um termo de busca');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('id, title, reference_code, owner_id, city, price')
        .or(`title.ilike.%${searchTerm}%,reference_code.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setProperties(data || []);

      if (!data || data.length === 0) {
        toast.info('Nenhum imóvel encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao buscar imóveis:', error);
      toast.error('Erro ao buscar imóveis');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveBrokers = async () => {
    try {
      const { data, error } = await supabase
        .from('brokers')
        .select('id, user_id, name, email, creci, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setBrokers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar corretores:', error);
      toast.error('Erro ao carregar corretores');
    }
  };

  const handleSelectProperty = async (property: Property) => {
    setSelectedProperty(property);
    await loadActiveBrokers();
  };

  const handleConfirmTransfer = () => {
    if (!selectedToBroker) {
      toast.error('Selecione o corretor de destino');
      return;
    }
    if (!reason.trim()) {
      toast.error('Informe o motivo da transferência');
      return;
    }
    setConfirmDialogOpen(true);
  };

  const executeTransfer = async () => {
    if (!selectedProperty) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('transfer-property', {
        body: {
          property_id: selectedProperty.id,
          to_broker_id: selectedToBroker,
          reason: reason.trim()
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast.success('Propriedade transferida com sucesso!');
      setConfirmDialogOpen(false);
      setSelectedProperty(null);
      setSelectedToBroker('');
      setReason('');
      setProperties([]);
      setSearchTerm('');
    } catch (error: any) {
      console.error('Erro ao transferir propriedade:', error);
      toast.error(error.message || 'Erro ao transferir propriedade');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
          <CardDescription>
            Apenas administradores podem acessar esta funcionalidade.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transferir Propriedade Entre Corretores</CardTitle>
          <CardDescription>
            Busque o imóvel e selecione o novo corretor responsável
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título, código ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchProperties()}
              />
            </div>
            <Button onClick={searchProperties} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {properties.length > 0 && (
            <div className="space-y-2">
              <Label>Imóveis Encontrados</Label>
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="p-3 hover:bg-accent cursor-pointer"
                    onClick={() => handleSelectProperty(property)}
                  >
                    <div className="font-medium">{property.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Código: {property.reference_code || 'N/A'} | {property.city || 'Sem cidade'}
                      {property.price && ` | R$ ${property.price.toLocaleString('pt-BR')}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProperty && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-accent p-4 rounded-md">
                <div className="font-semibold mb-2">Imóvel Selecionado:</div>
                <div>{selectedProperty.title}</div>
                <div className="text-sm text-muted-foreground">
                  Código: {selectedProperty.reference_code || 'N/A'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Transferir Para (Corretor de Destino)</Label>
                <Select value={selectedToBroker} onValueChange={setSelectedToBroker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers
                      .filter(b => b.user_id !== selectedProperty.owner_id)
                      .map((broker) => (
                        <SelectItem key={broker.id} value={broker.user_id}>
                          {broker.name} - {broker.email}
                          {broker.creci && ` (CRECI: ${broker.creci})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motivo da Transferência *</Label>
                <Textarea
                  placeholder="Ex: Solicitação via chamado #123, remanejamento de carteira, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleConfirmTransfer}
                disabled={!selectedToBroker || !reason.trim() || loading}
                className="w-full"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Transferir Propriedade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Transferência</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja transferir este imóvel?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div>
              <strong>Imóvel:</strong> {selectedProperty?.title}
            </div>
            <div>
              <strong>Motivo:</strong> {reason}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={executeTransfer} disabled={loading}>
              {loading ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
