import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from './useBroker';

export interface SubscriptionPayment {
  id: string;
  broker_id: string;
  subscription_id: string | null;
  asaas_payment_id: string | null;
  amount: number;
  status: 'pending' | 'confirmed' | 'overdue' | 'refunded';
  payment_method: 'pix' | 'credit_card' | 'boleto' | null;
  due_date: string;
  paid_at: string | null;
  invoice_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscriptionPayments() {
  const { broker } = useBroker();

  const { data: payments, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-payments', broker?.id],
    queryFn: async () => {
      if (!broker?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('broker_id', broker.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data as SubscriptionPayment[];
    },
    enabled: !!broker?.id,
  });

  const paymentsArray = payments || [];

  // Próximo pagamento (mais recente não pago ou o último em geral)
  const nextPayment = paymentsArray.find(p => 
    p.status === 'pending' || p.status === 'overdue'
  ) || paymentsArray[0];

  // Total pago (apenas confirmados)
  const totalPaid = paymentsArray
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Total pendente
  const totalPending = paymentsArray
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Pagamentos atrasados
  const overduePayments = paymentsArray.filter(p => p.status === 'overdue');

  return {
    payments: paymentsArray,
    isLoading,
    error,
    refetch,
    nextPayment,
    totalPaid,
    totalPending,
    overduePayments,
    hasPayments: paymentsArray.length > 0,
  };
}
