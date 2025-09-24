import { useState, useCallback } from 'react';
import { useBroker } from './useBroker';
import { supabase } from '@/integrations/supabase/client';

interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface PropertyData {
  titulo: string;
  valor: number;
  property_type: string;
  listing_type: string;
  endereco: string;
  cidade: string;
  bairro: string;
  quartos: number;
  banheiros: number;
  area: number;
  descricao: string;
  fotos?: string[];
  caracteristicas?: string[];
  coordinates?: { lat: number; lng: number };
  visibility?: string;
  is_public?: boolean;
}

interface ClientData {
  nome: string;
  telefone: string;
  email?: string;
  tipo: 'comprador' | 'vendedor' | 'locador' | 'locatario' | 'investidor';
  classificacao?: string;
  stage?: string;
  valor?: number;
  score?: number;
  historico?: any[];
}

interface UsePrivateAPIReturn {
  // Properties
  getProperties: (params?: Record<string, string>) => Promise<APIResponse>;
  getProperty: (id: string) => Promise<APIResponse>;
  createProperty: (data: PropertyData) => Promise<APIResponse>;
  updateProperty: (id: string, data: Partial<PropertyData>) => Promise<APIResponse>;
  deleteProperty: (id: string) => Promise<APIResponse>;
  
  // CRM/Clients
  getClients: (params?: Record<string, string>) => Promise<APIResponse>;
  getClient: (id: string) => Promise<APIResponse>;
  createClient: (data: ClientData) => Promise<APIResponse>;
  updateClient: (id: string, data: Partial<ClientData>) => Promise<APIResponse>;
  deleteClient: (id: string) => Promise<APIResponse>;
  
  // Analytics
  getAnalytics: (type: 'properties' | 'clients', period?: string) => Promise<APIResponse>;
  
  // Documentation
  getDocs: () => Promise<APIResponse>;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

export const usePrivateAPI = (): UsePrivateAPIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { broker } = useBroker();

  const apiCall = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse> => {
    if (!broker?.referral_code) {
      throw new Error('API key not available. Please ensure you are logged in.');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('private-api', {
        body: options.body || null,
        headers: {
          'x-api-key': broker.referral_code,
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>)
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      // If it's a direct call to the edge function, data might already be parsed
      if (data && typeof data === 'object') {
        return data;
      }

      // Fallback: parse as JSON if needed
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [broker?.referral_code]);

  // Properties methods
  const getProperties = useCallback(async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiCall(`/properties${queryString}`, { method: 'GET' });
  }, [apiCall]);

  const getProperty = useCallback(async (id: string) => {
    return apiCall(`/properties/${id}`, { method: 'GET' });
  }, [apiCall]);

  const createProperty = useCallback(async (data: PropertyData) => {
    return apiCall('/properties', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }, [apiCall]);

  const updateProperty = useCallback(async (id: string, data: Partial<PropertyData>) => {
    return apiCall(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }, [apiCall]);

  const deleteProperty = useCallback(async (id: string) => {
    return apiCall(`/properties/${id}`, { method: 'DELETE' });
  }, [apiCall]);

  // CRM/Clients methods
  const getClients = useCallback(async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiCall(`/clients${queryString}`, { method: 'GET' });
  }, [apiCall]);

  const getClient = useCallback(async (id: string) => {
    return apiCall(`/clients/${id}`, { method: 'GET' });
  }, [apiCall]);

  const createClient = useCallback(async (data: ClientData) => {
    return apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }, [apiCall]);

  const updateClient = useCallback(async (id: string, data: Partial<ClientData>) => {
    return apiCall(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }, [apiCall]);

  const deleteClient = useCallback(async (id: string) => {
    return apiCall(`/clients/${id}`, { method: 'DELETE' });
  }, [apiCall]);

  // Analytics
  const getAnalytics = useCallback(async (type: 'properties' | 'clients', period?: string) => {
    const params = new URLSearchParams({ type });
    if (period) params.append('period', period);
    return apiCall(`/analytics?${params.toString()}`, { method: 'GET' });
  }, [apiCall]);

  // Documentation
  const getDocs = useCallback(async () => {
    return apiCall('/docs', { method: 'GET' });
  }, [apiCall]);

  return {
    // Properties
    getProperties,
    getProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    
    // CRM/Clients
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    
    // Analytics
    getAnalytics,
    
    // Documentation
    getDocs,
    
    // State
    loading,
    error
  };
};

export default usePrivateAPI;