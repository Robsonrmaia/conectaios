import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUsernameGenerator } from './useUsernameGenerator';

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
  whatsapp?: string;
  status: string;
  subscription_status: string;
  subscription_expires_at?: string;
  referral_code?: string;
  cpf_cnpj?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  specialties?: string;
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
  const { generateUsername } = useUsernameGenerator();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
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
      
      // Use unified view for broker data
      const { data: brokerData, error: brokerError } = await supabase
        .from('vw_current_broker')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brokerError) {
        console.error('❌ Error fetching broker profile:', brokerError);
        throw brokerError;
      }

      if (brokerData) {
        console.log('✅ Broker profile loaded:', brokerData.broker_id);
        
        // Map view data to expected broker format
        const unifiedBroker = {
          id: brokerData.broker_id,
          user_id: brokerData.user_id,
          name: brokerData.display_name || '',
          email: brokerData.email || user.email || '',
          phone: brokerData.phone,
          bio: brokerData.bio,
          creci: brokerData.creci,
          username: brokerData.username,
          avatar_url: brokerData.avatar_url,
          cover_url: brokerData.cover_url,
          whatsapp: brokerData.whatsapp,
          referral_code: brokerData.referral_code,
          region_id: brokerData.region_id,
          plan_id: brokerData.plan_id,
          cpf_cnpj: brokerData.cpf_cnpj,
          status: brokerData.status || 'active',
          subscription_status: brokerData.subscription_status || 'trial',
          subscription_expires_at: brokerData.subscription_expires_at,
          website: brokerData.website,
          instagram: brokerData.instagram,
          linkedin: brokerData.linkedin,
          specialties: brokerData.specialties
        };
        
        setBroker(unifiedBroker);

        // Try to fetch plan if plan_id exists - fallback gracefully
        if (brokerData.plan_id) {
          try {
            const { data: planData } = await supabase
              .from('plans')
              .select('*')
              .eq('id', brokerData.plan_id)
              .maybeSingle();

            if (planData) {
              console.log('✅ Plan loaded:', planData.name);
              setPlan(planData);
            }
          } catch (planError) {
            console.warn('⚠️ Plan fetch failed, continuing without plan:', planError);
          }
        } else {
          console.log('ℹ️ No plan_id found, skipping plan fetch');
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

  const createBrokerProfile = async (data: Partial<Broker>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if broker profile already exists
      const { data: existingBroker } = await supabase
        .from('brokers')
        .select('id, name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingBroker) {
        console.log('✅ Broker profile already exists, using existing one');
        setBroker(existingBroker as Broker);
        await fetchBrokerProfile();
        return;
      }

      // Get default plan (starter)
      const { data: defaultPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', 'starter')
        .maybeSingle();

      // Generate username automatically if not provided
      let username = data.username;
      if (!username && data.name) {
        try {
          username = await generateUsername(data.name);
          console.log('✅ Generated username:', username);
        } catch (error) {
          console.error('❌ Error generating username:', error);
          // Fallback to email-based username
          username = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
        }
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

  const updateBrokerProfile = async (data: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('🔄 Updating broker profile:', data);
      
      // Use RPC function for unified save
      const { error } = await supabase.rpc('fn_profile_save', {
        p_user_id: user.id,
        p_name: data.name || null,
        p_phone: data.phone || null,
        p_bio: data.bio || null,
        p_avatar_url: data.avatar_url || null
      });

      if (error) {
        console.error('[useBroker] RPC fn_profile_save error:', {
          error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message
        });
        throw error;
      }
      
      console.log('✅ Broker profile updated successfully');
      
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