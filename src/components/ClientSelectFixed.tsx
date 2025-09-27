import React, { useState, useEffect } from 'react';
import { CRM, Client } from '@/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ClientSelectProps {
  onClientSelect: (client: Client) => void;
  value?: string;
}

export function ClientSelect({ onClientSelect, value }: ClientSelectProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        
        // Use CRM layer with legacy compatibility
        const clients = await CRM.clients.listAsLegacy();
        setClients(clients);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  const handleValueChange = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      onClientSelect(selectedClient);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Carregando..." : "Selecione um cliente"} />
      </SelectTrigger>
      <SelectContent>
        {clients.map(client => (
          <SelectItem key={client.id} value={client.id}>
            {client.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}