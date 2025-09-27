import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getBranding, type Branding } from '@/data/settings';

// Branding context interface
interface BrandingContextType {
  branding: Branding;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Default branding values
const defaultBranding: Branding = {
  logoUrl: '',
  heroUrl: ''
};

// Create context
const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  error: null,
  refresh: async () => {}
});

// Provider component
interface BrandingProviderProps {
  children: ReactNode;
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const brandingData = await getBranding();
      setBranding(brandingData);
    } catch (err) {
      console.error('Failed to load branding:', err);
      setError('Failed to load branding configuration');
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadBranding();
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const contextValue: BrandingContextType = {
    branding,
    loading,
    error,
    refresh
  };

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

// Custom hook to use branding
export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext);
  
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  
  return context;
}

// Convenience hooks for individual values
export function useLogo(): string {
  const { branding } = useBranding();
  return branding.logoUrl;
}

export function useHeroImage(): string {
  const { branding } = useBranding();
  return branding.heroUrl;
}