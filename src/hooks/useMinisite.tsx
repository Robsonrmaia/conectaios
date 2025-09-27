import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBroker } from './useBroker';
import { toast } from './use-toast';

interface MinisiteConfig {
  id?: string;
  broker_id?: string;
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
        .eq('broker_id', broker.id)
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
          .insert(defaultConfig)
          .select()
          .single();

        if (createError) throw createError;
        setConfig(newConfig as MinisiteConfig);
      }
    } catch (error) {
      console.error('Error fetching minisite config:', error);
      // Fallback: create local config if database fails
      const fallbackConfig = {
        broker_id: broker?.id || '',
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
      
      toast({
        title: "Aviso",
        description: "Usando configuração local. Salve para sincronizar com o servidor.",
        variant: "default",
      });
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
      const { error } = await supabase
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
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: "Seu minisite foi atualizado com sucesso.",
      });
    } catch (error) {
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
      await supabase
        .from('minisite_configs')
        .update({ generated_url: url })
        .eq('id', config.id);

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