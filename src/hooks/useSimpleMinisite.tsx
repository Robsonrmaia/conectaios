import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MinisiteConfig {
  id?: string;
  title: string;
  primary_color: string;
  secondary_color: string;
  template_id: string;
  show_properties: boolean;
  show_contact: boolean;
  show_about: boolean;
  custom_domain?: string;
}

interface MinisiteContextType {
  config: MinisiteConfig;
  loading: boolean;
  updateConfig: (newConfig: Partial<MinisiteConfig>) => void;
  saveConfig: () => Promise<void>;
  generateUrl: () => Promise<string | null>;
}

const MinisiteContext = createContext<MinisiteContextType | undefined>(undefined);

const defaultConfig: MinisiteConfig = {
  title: 'Meu Minisite',
  primary_color: '#3B82F6',
  secondary_color: '#EF4444',
  template_id: 'default',
  show_properties: true,
  show_contact: true,
  show_about: true
};

export function SimplifiedMinisiteProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MinisiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchConfig = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('minisite_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setConfig({
          id: data.id,
          title: data.title || defaultConfig.title,
          primary_color: data.primary_color || defaultConfig.primary_color,
          secondary_color: data.secondary_color || defaultConfig.secondary_color,
          template_id: data.template_id || defaultConfig.template_id,
          show_properties: data.show_properties ?? defaultConfig.show_properties,
          show_contact: data.show_contact ?? defaultConfig.show_contact,
          show_about: data.show_about ?? defaultConfig.show_about,
          custom_domain: data.custom_domain || undefined
        });
      }
    } catch (error) {
      console.error('Error fetching minisite config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (newConfig: Partial<MinisiteConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const saveConfig = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('minisite_configs')
        .upsert({
          user_id: user.id,
          title: config.title,
          primary_color: config.primary_color,
          secondary_color: config.secondary_color,
          template_id: config.template_id,
          show_properties: config.show_properties,
          show_contact: config.show_contact,
          show_about: config.show_about,
          custom_domain: config.custom_domain
        });

      if (error) {
        console.error('Error saving minisite config:', error);
      }
    } catch (error) {
      console.error('Error saving minisite config:', error);
    }
  };

  const generateUrl = async (): Promise<string | null> => {
    if (!user) return null;
    
    // Gerar uma URL única baseada no user ID
    const slug = `minisite-${user.id.slice(0, 8)}`;
    return `https://conectaios.lovableproject.com/minisite/${slug}`;
  };

  useEffect(() => {
    fetchConfig();
  }, [user]);

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

export function useSimpleMinisite() {
  const context = useContext(MinisiteContext);
  if (context === undefined) {
    throw new Error('useSimpleMinisite must be used within a SimplifiedMinisiteProvider');
  }
  return context;
}