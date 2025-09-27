import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Broker {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  status?: string;
  subscription_status?: string;
  creci?: string;
  phone?: string;
  avatar_url?: string;
  cover_url?: string;
  username?: string;
  bio?: string;
  whatsapp?: string;
  cpf_cnpj?: string;
  referral_code?: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  property_limit: number;
  minisite_enabled: boolean;
  whatsapp_integration: boolean;
  ai_features: boolean;
}

export const useBroker = () => {
  const { user } = useAuth();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBrokerProfile();
    }
  }, [user]);

  const fetchBrokerProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Use brokers table with simplified data
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brokerData) {
        setBroker({
          id: brokerData.id,
          user_id: brokerData.user_id,
          name: brokerData.creci || 'Corretor',
          email: user.email || '',
          status: 'active',
          subscription_status: 'trial'
        });

        // Mock plan data
        setPlan({
          id: 'trial',
          name: 'Plano Trial',
          slug: 'trial',
          price: 0,
          property_limit: 10,
          minisite_enabled: true,
          whatsapp_integration: false,
          ai_features: false
        });
      }
    } catch (error) {
      console.error('Error fetching broker:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBrokerProfile = async (data: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: newBroker, error } = await supabase
        .from('brokers')
        .insert({
          user_id: user.id,
          creci: data.creci || '',
          bio: data.bio || '',
          whatsapp: data.whatsapp || '',
          minisite_slug: data.minisite_slug || ''
        })
        .select()
        .single();

      if (error) throw error;

      setBroker({
        id: newBroker.id,
        user_id: newBroker.user_id,
        name: newBroker.creci || 'Corretor',
        email: user.email || '',
        status: 'active',
        subscription_status: 'trial'
      });

      return newBroker;
    } catch (error) {
      console.error('Error creating broker:', error);
      throw error;
    }
  };

  const updateBrokerProfile = async (updates: any) => {
    if (!broker) throw new Error('No broker profile found');

    try {
      const { data, error } = await supabase
        .from('brokers')
        .update(updates)
        .eq('id', broker.id)
        .select()
        .single();

      if (error) throw error;

      setBroker(prev => prev ? { ...prev, ...updates } : null);
      return data;
    } catch (error) {
      console.error('Error updating broker:', error);
      throw error;
    }
  };

  return {
    broker,
    plan,
    loading,
    fetchBrokerProfile,
    createBrokerProfile,
    updateBrokerProfile,
    // Legacy exports for compatibility
    createBrokerUser: createBrokerProfile,
    updateBroker: updateBrokerProfile
  };
};