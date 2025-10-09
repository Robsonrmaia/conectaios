import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from './useBroker';

export function useOlxPublications() {
  const { broker } = useBroker();
  
  // Buscar limite do plano do corretor
  const { data: limit, isLoading: loadingLimit } = useQuery({
    queryKey: ['olx-limit', broker?.id],
    queryFn: async () => {
      if (!broker?.id) return 0;
      
      const { data, error } = await supabase.rpc('get_broker_olx_limit', {
        p_broker_id: broker.id
      });
      
      if (error) {
        console.error('Error fetching OLX limit:', error);
        return 0;
      }
      
      return data || 0;
    },
    enabled: !!broker?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Contar quantos imóveis estão habilitados para OLX
  const { data: currentCount, isLoading: loadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['olx-count', broker?.user_id],
    queryFn: async () => {
      if (!broker?.user_id) return 0;
      
      const { count, error } = await supabase
        .from('imoveis')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', broker.user_id)
        .eq('olx_enabled', true);
      
      if (error) {
        console.error('Error counting OLX properties:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!broker?.user_id,
    staleTime: 30 * 1000, // 30 segundos
  });
  
  const canEnableMore = (currentCount || 0) < (limit || 0);
  const hasAccess = (limit || 0) > 0;
  const isLoading = loadingLimit || loadingCount;
  
  return { 
    limit: limit || 0, 
    currentCount: currentCount || 0, 
    canEnableMore, 
    hasAccess,
    isLoading,
    refetchCount
  };
}
