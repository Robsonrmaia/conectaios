import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { brokerService, BrokerData } from '@/data/broker';

export const useBroker = () => {
  const { user } = useAuth();
  const [data, setData] = useState<BrokerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBroker();
    } else {
      setData(null);
      setError(null);
    }
  }, [user]);

  const fetchBroker = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const brokerData = await brokerService.getCurrent();
      setData(brokerData);
    } catch (err) {
      console.error('Error fetching broker:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar corretor');
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (updates: Partial<BrokerData>) => {
    try {
      setError(null);
      const updatedData = await brokerService.update(updates);
      setData(updatedData);
      return updatedData;
    } catch (err) {
      console.error('Error updating broker:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar corretor');
      throw err;
    }
  };

  return {
    data,
    isLoading,
    error,
    update,
    refresh: fetchBroker
  };
};