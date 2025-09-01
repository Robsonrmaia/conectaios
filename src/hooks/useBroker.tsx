import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Broker {
  id: string;
  user_id: string;
  region_id?: string;
  plan_id?: string;
  name: string;
  email: string;
  phone?: string;
  creci?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  status: string;
  subscription_status: string;
  subscription_expires_at?: string;
  referral_code?: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  property_limit: number;
  match_limit: number;
  thread_limit: number;
  features: any; // Use any to handle Json type from Supabase
}

interface BrokerContextType {
  broker: Broker | null;
  plan: Plan | null;
  loading: boolean;
  createBrokerProfile: (data: Partial<Broker>) => Promise<void>;
  updateBrokerProfile: (data: Partial<Broker>) => Promise<void>;
}

const BrokerContext = createContext<BrokerContextType | undefined>(undefined);

export function BrokerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBrokerProfile();
    } else {
      setBroker(null);
      setPlan(null);
      setLoading(false);
    }
  }, [user]);

  const fetchBrokerProfile = async () => {
    if (!user) return;

    try {
      // Fetch broker profile
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (brokerError && brokerError.code !== 'PGRST116') {
        throw brokerError;
      }

      if (brokerData) {
        setBroker(brokerData);

        // Fetch plan details if broker has plan_id
        if (brokerData.plan_id) {
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', brokerData.plan_id)
            .single();

          if (planError) {
            console.error('Error fetching plan:', planError);
          } else {
            setPlan(planData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching broker profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBrokerProfile = async (data: Partial<Broker>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get default plan (starter)
      const { data: defaultPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', 'starter')
        .maybeSingle();

      // Validate region_id if provided
      const profileData: any = {
        user_id: user.id,
        name: data.name || user.email?.split('@')[0] || 'Corretor',
        email: user.email!,
        plan_id: defaultPlan?.id,
        referral_code: await generateReferralCode(),
        phone: data.phone || null,
        creci: data.creci || null,
        username: data.username || null,
        bio: data.bio || null,
        status: 'active'
      };

      // Only add region_id if it's provided and not empty
      if (data.region_id && data.region_id.trim() !== '') {
        profileData.region_id = data.region_id;
      }

      const { data: brokerData, error } = await supabase
        .from('brokers')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      setBroker(brokerData);
      await fetchBrokerProfile(); // Refresh to get plan data
    } catch (error) {
      console.error('Error creating broker profile:', error);
      throw error;
    }
  };

  const updateBrokerProfile = async (data: Partial<Broker>) => {
    if (!broker) throw new Error('No broker profile found');

    try {
      const { data: updatedBroker, error } = await supabase
        .from('brokers')
        .update(data)
        .eq('id', broker.id)
        .select()
        .single();

      if (error) throw error;
      setBroker(updatedBroker);
    } catch (error) {
      console.error('Error updating broker profile:', error);
      throw error;
    }
  };

  const generateReferralCode = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_referral_code');
      if (error) {
        // Fallback: generate a simple referral code
        return Math.random().toString(36).substring(2, 10).toUpperCase();
      }
      return data;
    } catch (error) {
      // Fallback: generate a simple referral code  
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  };

  return (
    <BrokerContext.Provider 
      value={{ 
        broker, 
        plan, 
        loading, 
        createBrokerProfile, 
        updateBrokerProfile 
      }}
    >
      {children}
    </BrokerContext.Provider>
  );
}

export function useBroker() {
  const context = useContext(BrokerContext);
  if (context === undefined) {
    throw new Error('useBroker must be used within a BrokerProvider');
  }
  return context;
}