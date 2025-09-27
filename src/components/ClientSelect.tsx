import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  nome: string;
  telefone: string;
}

interface ClientSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ClientSelect({ value, onValueChange, placeholder = "Selecione um cliente" }: ClientSelectProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('conectaios_clients')
        .select('id, nome, telefone')
        .eq('user_id', user?.id)
        .order('nome');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Carregando clientes..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Nenhum cliente</SelectItem>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.nome}>
            {client.nome} {client.telefone && `- ${client.telefone}`}
          </SelectItem>
        ))}
        <SelectItem value="__new__">+ Adicionar Novo Cliente</SelectItem>
      </SelectContent>
    </Select>
  );
}