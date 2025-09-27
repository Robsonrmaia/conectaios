import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { suppressTypes } from '@/utils/typeSuppress';

export function useBroker() {
  const { user } = useAuth();
  const [broker, setBroker] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setBroker({ id: user.id, user_id: user.id, name: user.email });
          setPlan({ id: '1', name: 'Free', features: [] });
        }
      }, 2000);

      fetchBrokerProfile().finally(() => {
        clearTimeout(timeout);
      });

      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBrokerProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch broker
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brokerData) {
        setBroker(suppressTypes.object(brokerData));
      } else {
        // Create broker
        const { data: newBroker } = await supabase
          .from('brokers')
          .insert({ 
            user_id: user.id,
            name: user.email,
            email: user.email 
          })
          .select()
          .single();
        setBroker(suppressTypes.object(newBroker));
      }

      // Fetch plan
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (planData) {
        setPlan(suppressTypes.object(planData));
      }
    } catch (error) {
      console.error('Error fetching broker:', error);
      setBroker({ id: user.id, user_id: user.id, name: user.email });
      setPlan({ id: '1', name: 'Free', features: [] });
    } finally {
      setLoading(false);
    }
  };

  const createBrokerProfile = async (data: any) => {
    try {
      const { data: newBroker, error } = await supabase
        .from('brokers')
        .insert({ ...data, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      setBroker(suppressTypes.object(newBroker));
      return newBroker;
    } catch (error) {
      console.error('Error creating broker:', error);
      throw error;
    }
  };

  const updateBrokerProfile = async (data: any) => {
    if (!user || !broker) return;

    try {
      const { error } = await supabase
        .from('brokers')
        .update(data)
        .eq('user_id', user.id);

      if (error) throw error;
      setBroker((prev: any) => prev ? { ...prev, ...data } : prev);
    } catch (error) {
      console.error('Error updating broker:', error);
      throw error;
    }
  };

  return {
    broker,
    plan,
    loading,
    createBrokerProfile,
    updateBrokerProfile,
    fetchBrokerProfile
  };
}