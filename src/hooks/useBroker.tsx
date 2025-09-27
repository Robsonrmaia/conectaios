import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { brokerService, type BrokerData } from '@/data/broker';

export interface Broker extends BrokerData {
  status?: string;
  subscription_status?: string;
  cpf_cnpj?: string;
  referral_code?: string;
  username?: string;
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
      
      const brokerData = await brokerService.getCurrent();
      if (brokerData) {
        setBroker({
          ...brokerData,
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
      const updatedData = await brokerService.update({
        creci: data.creci || '',
        bio: data.bio || '',
        whatsapp: data.whatsapp || '',
        minisite_slug: data.minisite_slug || ''
      });

      setBroker({
        ...updatedData,
        status: 'active',
        subscription_status: 'trial'
      });

      return updatedData;
    } catch (error) {
      console.error('Error creating broker:', error);
      throw error;
    }
  };

  const updateBrokerProfile = async (updates: any) => {
    if (!broker) throw new Error('No broker profile found');

    try {
      const updatedData = await brokerService.update(updates);
      setBroker(prev => prev ? { ...prev, ...updatedData } : null);
      return updatedData;
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