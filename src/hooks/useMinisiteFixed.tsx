import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { minisiteService, MinisiteConfig } from '@/data/minisite';

export const useMinisiteConfig = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<MinisiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConfig();
    } else {
      setConfig(null);
      setError(null);
    }
  }, [user]);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const configData = await minisiteService.getConfig();
      setConfig(configData);
    } catch (err) {
      console.error('Error fetching minisite config:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração do minisite');
    } finally {
      setIsLoading(false);
    }
  };

  const upsert = async (updates: Partial<MinisiteConfig>) => {
    try {
      setError(null);
      const updatedConfig = await minisiteService.upsertConfig(updates);
      setConfig(updatedConfig);
      return updatedConfig;
    } catch (err) {
      console.error('Error upserting minisite config:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração do minisite');
      throw err;
    }
  };

  return {
    config,
    isLoading,
    error,
    upsert,
    refresh: fetchConfig
  };
};