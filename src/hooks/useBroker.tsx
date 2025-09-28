import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface BrokerContextType {
  broker: any;
  plan: any;
  loading: boolean;
  createBrokerProfile: (data: any) => Promise<void>;
  updateBrokerProfile: (data: any) => Promise<void>;
}

const BrokerContext = createContext<BrokerContextType | undefined>(undefined);

export function BrokerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [broker, setBroker] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('⚠️ Broker profile loading timeout - proceeding without broker');
          setLoading(false);
        }
      }, 3000);

      fetchBrokerProfile().finally(() => {
        clearTimeout(timeout);
      });

      return () => clearTimeout(timeout);
    } else {
      setBroker(null);
      setPlan(null);
      setLoading(false);
    }
  }, [user]);

  const fetchBrokerProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔄 Fetching broker profile for user:', user.id);
      
      // Fetch broker profile with ORDER BY to handle any potential duplicates
      const { data: brokerData, error: brokerError } = await supabase
        .from('conectaios_brokers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (brokerError) {
        console.error('❌ Error fetching broker profile:', brokerError);
        throw brokerError;
      }

      if (brokerData) {
        console.log('✅ Broker profile loaded:', brokerData.id);
        setBroker(brokerData);

        // Fetch plan details if broker has plan_id
        if (brokerData.plan_id) {
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', brokerData.plan_id)
            .maybeSingle();

          if (planError) {
            console.error('⚠️ Error fetching plan:', planError);
          } else if (planData) {
            console.log('✅ Plan loaded:', planData.name);
            setPlan(planData);
          }
        }
      } else {
        console.log('ℹ️ No broker profile found for user');
        setBroker(null);
      }
    } catch (error) {
      console.error('❌ Error in fetchBrokerProfile:', error);
      // Set broker to null on error to prevent infinite loading
      setBroker(null);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const createBrokerProfile = async (data: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if broker profile already exists
      const { data: existingBroker } = await supabase
        .from('conectaios_brokers')
        .select('id, name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingBroker) {
        console.log('✅ Broker profile already exists, using existing one');
        setBroker(existingBroker as any);
        await fetchBrokerProfile();
        return;
      }

      // Get default plan (starter)
      const { data: defaultPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', 'starter')
        .maybeSingle();

      // Generate simple username
      let username = data.username;
      if (!username && data.name) {
        username = data.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'user';
      }

      // Validate region_id if provided
      const profileData: any = {
        user_id: user.id,
        name: data.name || user.email?.split('@')[0] || 'Corretor',
        email: user.email!,
        plan_id: defaultPlan?.id,
        referral_code: await generateReferralCode(),
        phone: data.phone || null,
        creci: data.creci || null,
        username: username || null,
        bio: data.bio || null,
        status: 'active'
      };

      // Only add region_id if it's provided and not empty
      if (data.region_id && data.region_id.trim() !== '') {
        profileData.region_id = data.region_id;
      }

      const { data: brokerData, error } = await supabase
        .from('conectaios_brokers')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      setBroker(brokerData as any);
      await fetchBrokerProfile(); // Refresh to get plan data
    } catch (error) {
      console.error('Error creating broker profile:', error);
      throw error;
    }
  };

  const updateBrokerProfile = async (data: any) => {
    if (!broker) throw new Error('No broker profile found');

    try {
      const { data: updatedBroker, error } = await supabase
        .from('conectaios_brokers')
        .update(data as never)
        .eq('id', broker.id)
        .select()
        .single();

      if (error) throw error;
      setBroker(updatedBroker as any);
      
      // Refresh broker profile to ensure we have the latest data
      await fetchBrokerProfile();
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