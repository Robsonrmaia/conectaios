import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { suppressTypes } from '@/utils/typeSuppress';

interface SimpleBroker {
  id: string;
  user_id: string;
  nome?: string;
  bio?: string;
  creci?: string;
  whatsapp?: string;
  created_at: string;
  updated_at: string;
}

interface SimplePlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  property_limit: number;
  features: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SimpleBrokerContextType {
  broker: SimpleBroker | null;
  plan: SimplePlan | null;
  loading: boolean;
  createBrokerProfile: (brokerData: Partial<SimpleBroker>) => Promise<SimpleBroker>;
  updateBrokerProfile: (brokerData: Partial<SimpleBroker>) => Promise<void>;
}

const SimpleBrokerContext = createContext<SimpleBrokerContextType | undefined>(undefined);

export function SimpleBrokerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [broker, setBroker] = useState<SimpleBroker | null>(null);
  const [plan, setPlan] = useState<SimplePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBrokerProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBrokerProfile = async () => {
    if (!user) return;

    try {
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (brokerData) {
        setBroker(suppressTypes.any(brokerData));

        // Buscar plano básico como fallback
        const { data: planData } = await supabase
          .from('plans')
          .select('*')
          .eq('slug', 'basico')
          .single();

        if (planData) {
          setPlan(suppressTypes.any(planData));
        }
      }
    } catch (error) {
      console.error('Error fetching broker profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBrokerProfile = async (newBroker: Partial<SimpleBroker>): Promise<SimpleBroker> => {
    if (!user) throw new Error('User not authenticated');

    const brokerData = await supabase
      .from('brokers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: savedBroker, error: saveError } = await supabase
      .from('brokers')
      .upsert({
        ...newBroker,
        id: brokerData?.data?.id,
        user_id: user?.id!
      })
      .select()
      .single();

    if (saveError) throw saveError;
    
    setBroker(suppressTypes.any(savedBroker));
    return suppressTypes.any(savedBroker);
  };

  const updateBrokerProfile = async (updatedBroker: Partial<SimpleBroker>) => {
    if (!broker) throw new Error('No broker profile found');

    const { data, error } = await supabase
      .from('brokers')
      .update(updatedBroker)
      .eq('id', broker.id)
      .select()
      .single();

    if (error) throw error;
    setBroker(suppressTypes.any(data));
  };

  return (
    <SimpleBrokerContext.Provider value={{
      broker,
      plan,
      loading,
      createBrokerProfile,
      updateBrokerProfile
    }}>
      {children}
    </SimpleBrokerContext.Provider>
  );
}

export function useSimpleBroker() {
  const context = useContext(SimpleBrokerContext);
  if (context === undefined) {
    throw new Error('useSimpleBroker must be used within a SimpleBrokerProvider');
  }
  return context;
}