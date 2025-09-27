import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BrokerData } from '@/data/broker';

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
    if (!user) {
      setData(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Primeiro, tentar buscar broker existente
      const { data: existingBroker, error: brokerError } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingBroker) {
        // Buscar dados do profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const brokerData = {
          ...existingBroker,
          name: profileData?.name || profileData?.nome || 'Corretor',
          email: profileData?.email || user.email,
          avatar_url: profileData?.avatar_url,
          cover_url: profileData?.cover_url,
          referral_code: `REF${user.id.slice(-8).toUpperCase()}`
        };
        
        setData(brokerData);
        return;
      }

      if (brokerError && brokerError.code !== 'PGRST116') {
        throw brokerError;
      }

      // Se não existe broker, criar um novo
      const { data: newBroker, error: createError } = await supabase
        .from('brokers')
        .insert({
          user_id: user.id,
          creci: null,
          bio: null,
          whatsapp: null,
          minisite_slug: null
        })
        .select()
        .single();

      if (createError) throw createError;

      // Buscar dados do profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const brokerData = {
        ...newBroker,
        name: profileData?.name || profileData?.nome || 'Corretor',
        email: profileData?.email || user.email,
        avatar_url: profileData?.avatar_url,
        cover_url: profileData?.cover_url,
        referral_code: `REF${user.id.slice(-8).toUpperCase()}`
      };
      
      setData(brokerData);
    } catch (err) {
      console.error('Error fetching broker:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar corretor');
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (updates: Partial<BrokerData>) => {
    if (!user || !data) return null;

    try {
      setError(null);
      
      // Separar atualizações para broker e profile
      const brokerUpdates: any = {};
      const profileUpdates: any = {};

      Object.keys(updates).forEach(key => {
        if (['creci', 'bio', 'whatsapp', 'minisite_slug'].includes(key)) {
          brokerUpdates[key] = updates[key as keyof BrokerData];
        } else if (['name', 'avatar_url', 'cover_url', 'email'].includes(key)) {
          if (key === 'name') profileUpdates.nome = updates[key as keyof BrokerData];
          else profileUpdates[key] = updates[key as keyof BrokerData];
        }
      });

      // Atualizar broker se necessário
      if (Object.keys(brokerUpdates).length > 0) {
        const { error: brokerError } = await supabase
          .from('brokers')
          .update(brokerUpdates)
          .eq('id', data.id);
        
        if (brokerError) throw brokerError;
      }

      // Atualizar profile se necessário
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);
        
        if (profileError) throw profileError;
      }

      // Recarregar dados atualizados
      await fetchBroker();
      return data;
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
    refresh: fetchBroker,
    // Legacy compatibility
    broker: data,
    loading: isLoading,
    updateBrokerProfile: update,
    fetchBrokerProfile: fetchBroker,
    createBrokerProfile: update,
    updateBroker: update,
    createBrokerUser: update
  };
};