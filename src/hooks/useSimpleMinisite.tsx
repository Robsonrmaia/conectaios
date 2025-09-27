import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { suppressTypes } from '@/utils/typeSuppress';

export interface SimpleMinisiteConfig {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  primary_color: string;
  secondary_color: string;
  template_id: string;
  show_properties: boolean;
  show_contact: boolean;
  show_about: boolean;
  custom_domain?: string;
  generated_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface SimpleMinisiteContextType {
  config: SimpleMinisiteConfig | null;
  loading: boolean;
  updateConfig: (updates: Partial<SimpleMinisiteConfig>) => void;
  saveConfig: () => Promise<void>;
  generateUrl: () => Promise<string>;
}

const SimpleMinisiteContext = createContext<SimpleMinisiteContextType | undefined>(undefined);

export function SimpleMinisiteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [config, setConfig] = useState<SimpleMinisiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMinisiteConfig = async () => {
    if (!user?.id) return;

    try {
      const { data: config, error } = await supabase
        .from('minisite_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (config) {
        setConfig(suppressTypes.any(config));
      } else {
        // Criar configuração padrão
        const defaultConfig = {
          user_id: user.id,
          title: 'Meu Minisite',
          description: 'Descrição do meu minisite',
          primary_color: '#3B82F6',
          secondary_color: '#EF4444',
          template_id: 'default',
          show_properties: true,
          show_contact: true,
          show_about: true
        };

        const { data: newConfig, error: createError } = await supabase
          .from('minisite_configs')
          .insert(defaultConfig)
          .select()
          .single();

        if (createError) throw createError;
        setConfig(suppressTypes.any(newConfig));
      }
    } catch (error) {
      console.error('Error fetching minisite config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMinisiteConfig();
    }
  }, [user]);

  const updateConfig = (updates: Partial<SimpleMinisiteConfig>) => {
    if (!config) return;
    setConfig(suppressTypes.any({ ...config, ...updates }));
  };

  const saveConfig = async () => {
    if (!config || !user?.id) return;

    try {
      const { error } = await supabase
        .from('minisite_configs')
        .upsert({
          ...config,
          user_id: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  };

  const generateUrl = async (): Promise<string> => {
    if (!config || !user) return '';

    try {
      const slug = `broker-${user.id}-${Date.now()}`;
      const generatedUrl = `/broker/${slug}`;

      updateConfig({ generated_url: generatedUrl });
      await saveConfig();

      return generatedUrl;
    } catch (error) {
      console.error('Error generating URL:', error);
      return '';
    }
  };

  return (
    <SimpleMinisiteContext.Provider value={{
      config,
      loading,
      updateConfig,
      saveConfig,
      generateUrl
    }}>
      {children}
    </SimpleMinisiteContext.Provider>
  );
}

export function useSimpleMinisite() {
  const context = useContext(SimpleMinisiteContext);
  if (context === undefined) {
    throw new Error('useSimpleMinisite must be used within a SimpleMinisiteProvider');
  }
  return context;
}