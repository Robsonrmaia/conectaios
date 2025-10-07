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
      console.log('🔍 Fetching partnerships for user:', user.id);
      
      // Simplificado - sem joins complexos para evitar problemas de RLS
      const { data, error } = await supabase
        .from('broker_partnerships')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Partnerships result:', { count: data?.length, error });

      if (error) {
        console.error('❌ Partnership fetch error:', error);
        throw error;
      }
      
      setPartnerships(data || []);
      console.log('✅ Partnerships loaded:', data?.length);
    } catch (error: any) {
      console.error('Error fetching partnerships:', error);
      toast.error(`Erro ao carregar parcerias: ${error.message}`);
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
