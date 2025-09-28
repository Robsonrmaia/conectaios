import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBroker } from './useBroker';
import { toast } from './use-toast';

interface MinisiteConfig {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  primary_color: string;
  secondary_color: string;
  template_id: string;
  show_properties: boolean;
  show_contact_form: boolean;
  show_about: boolean;
  phone?: string;
  email?: string;
  whatsapp?: string;
  custom_message?: string;
  generated_url?: string;
  is_active: boolean;
  config_data?: any;
  custom_domain?: string;
  domain_verified?: boolean;
}

interface MinisiteContextType {
  config: MinisiteConfig | null;
  loading: boolean;
  updateConfig: (updates: Partial<MinisiteConfig>) => Promise<void>;
  saveConfig: () => Promise<void>;
  generateUrl: () => Promise<string | null>;
}

const MinisiteContext = createContext<MinisiteContextType | undefined>(undefined);

export function MinisiteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [config, setConfig] = useState<MinisiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (broker) {
      fetchMinisiteConfig();
    }
  }, [broker]);

  const fetchMinisiteConfig = async () => {
    if (!broker) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('minisite_configs')
        .select('*')
        .eq('user_id', broker.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data as MinisiteConfig);
      } else {
        // Create default config
        const defaultConfig = {
          broker_id: broker.id,
          title: broker.name || 'Meu Mini Site',
          description: broker.bio || '',
          primary_color: '#1CA9C9',
          secondary_color: '#64748B',
          template_id: 'modern',
          show_properties: true,
          show_contact_form: true,
          show_about: true,
          phone: broker.phone || '',
          email: broker.email || '',
          whatsapp: broker.phone || '',
          is_active: true,
          config_data: {}
        };

        const { data: newConfig, error: createError } = await supabase
          .from('minisite_configs')
          .insert({
            user_id: broker.user_id,
            title: broker.name || 'Meu Mini Site',
            description: broker.bio || '',
            primary_color: '#1CA9C9',
            secondary_color: '#64748B',
            template_id: 'modern',
            show_properties: true,
            show_contact_form: true,
            show_about: true,
            phone: broker.phone || '',
            email: broker.email || '',
            whatsapp: broker.phone || '',
            is_active: true,
            config_data: {}
          })
          .select()
          .single();

        if (createError) throw createError;
        setConfig(newConfig as MinisiteConfig);
      }
    } catch (error) {
      console.error('Error fetching minisite config:', error);
      // Fallback: create local config if database fails
      const fallbackConfig = {
        user_id: broker?.user_id || '',
        title: broker?.name || 'Meu Mini Site',
        description: broker?.bio || '',
        primary_color: '#1CA9C9',
        secondary_color: '#64748B',
        template_id: 'modern',
        show_properties: true,
        show_contact_form: true,
        show_about: true,
        phone: broker?.phone || '',
        email: broker?.email || '',
        whatsapp: broker?.phone || '',
        is_active: true,
        config_data: {}
      };
      setConfig(fallbackConfig);
      
      // Only show local config warning in development when envs are missing
      if (import.meta.env.MODE === 'development' && 
          (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY ||
           import.meta.env.VITE_SUPABASE_URL === '__REQUIRED__' || 
           import.meta.env.VITE_SUPABASE_ANON_KEY === '__REQUIRED__')) {
        toast({
          title: "Aviso",
          description: "Usando configuração local. Salve para sincronizar com o servidor.",
          variant: "default",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<MinisiteConfig>) => {
    if (!config) return;

    const updatedConfig = { ...config, ...updates };
    setConfig(updatedConfig);
  };

  const saveConfig = async () => {
    if (!config || !broker) return;

    try {
      if (import.meta.env.DEV) {
        console.log('💾 Minisite: Saving config for user:', broker.user_id);
      }

      // Upsert: Create if not exists, update if exists
      const { data: existing } = await supabase
        .from('minisite_configs')
        .select('id')
        .eq('user_id', broker.user_id)
        .maybeSingle();

      if (!existing) {
        // Insert new config
        const { error: insertError } = await supabase
          .from('minisite_configs')
          .insert({
            user_id: broker.user_id,
            title: config.title,
            description: config.description,
            primary_color: config.primary_color,
            secondary_color: config.secondary_color,
            template_id: config.template_id,
            show_properties: config.show_properties,
            show_contact_form: config.show_contact_form,
            show_about: config.show_about,
            phone: config.phone,
            email: config.email,
            whatsapp: config.whatsapp,
            custom_message: config.custom_message,
            is_active: config.is_active,
            config_data: config.config_data,
            custom_domain: config.custom_domain
          });

        if (insertError) throw insertError;
      } else {
        // Update existing config  
        const { error: updateError } = await supabase
          .from('minisite_configs')
          .update({
            title: config.title,
            description: config.description,
            primary_color: config.primary_color,
            secondary_color: config.secondary_color,
            template_id: config.template_id,
            show_properties: config.show_properties,
            show_contact_form: config.show_contact_form,
            show_about: config.show_about,
            phone: config.phone,
            email: config.email,
            whatsapp: config.whatsapp,
            custom_message: config.custom_message,
            is_active: config.is_active,
            config_data: config.config_data,
            custom_domain: config.custom_domain,
            domain_verified: config.domain_verified
          })
          .eq('user_id', broker.user_id);

        if (updateError) throw updateError;
      }

      if (import.meta.env.DEV) {
        console.log('✅ Minisite: Config saved successfully');
      }

      toast({
        title: "Configurações salvas!",
        description: "Seu minisite foi atualizado com sucesso.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Minisite save error:', error);
      }
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const generateUrl = async (): Promise<string | null> => {
    if (!broker || !config) return null;

    const username = broker.username || `broker-${broker.id.slice(0, 8)}`;
    const url = `/broker/${username}`;
    
    try {
      if (config.id) {
        const { error: updateError } = await supabase
          .from('minisite_configs')
          .update({ config_data: { ...config.config_data, generated_url: url } })
          .eq('id', config.id);
        
        if (updateError) {
          console.warn('Failed to save generated URL:', updateError);
        }
      }

      setConfig(prev => prev ? { ...prev, generated_url: url } : null);
      return url;
    } catch (error) {
      console.error('Error generating URL:', error);
      return null;
    }
  };

  return (
    <MinisiteContext.Provider value={{
      config,
      loading,
      updateConfig,
      saveConfig,
      generateUrl
    }}>
      {children}
    </MinisiteContext.Provider>
  );
}

export function useMinisite() {
  const context = useContext(MinisiteContext);
  if (context === undefined) {
    throw new Error('useMinisite must be used within a MinisiteProvider');
  }
  return context;
}