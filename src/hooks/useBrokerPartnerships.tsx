import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BrokerPartnership {
  id: string;
  property_id: string;
  status: string;
  commission_split: Record<string, number>;
  contract_signed: boolean;
  created_at: string;
  expires_at: string | null;
  property?: any;
  participants?: any[];
  proposals?: any[];
}

export const useBrokerPartnerships = () => {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<BrokerPartnership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartnerships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('broker_partnerships')
        .select(`
          *,
          property:imoveis(id, title, reference_code, price),
          participants:partnership_participants(*),
          proposals:partnership_proposals(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerships(data || []);
    } catch (error: any) {
      console.error('Error fetching partnerships:', error);
      toast.error('Erro ao carregar parcerias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerships();
  }, [user]);

  return {
    partnerships,
    loading,
    refetch: fetchPartnerships
  };
};
