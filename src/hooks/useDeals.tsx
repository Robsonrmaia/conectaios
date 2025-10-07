import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Deal {
  id: string;
  user_id: string;
  client_id: string | null;
  property_id: string | null;
  offer_amount: number | null;
  commission_amount: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: {
    nome: string;
    email?: string;
    telefone?: string;
  };
  property?: {
    title: string;
    reference_code?: string;
    price?: number;
  };
  partners?: DealPartner[];
}

export interface DealPartner {
  id: string;
  deal_id: string;
  partner_name: string;
  partner_email: string | null;
  partner_phone: string | null;
  partner_role: 'broker' | 'investor' | 'consultant' | 'lawyer' | 'other';
  commission_percentage: number | null;
  notes: string | null;
  added_at: string;
}

export const useDeals = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(nome, email, telefone),
          property:imoveis(title, reference_code, price)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar parceiros de cada deal
      const dealsWithPartners = await Promise.all(
        (data || []).map(async (deal) => {
          const { data: partners } = await supabase
            .from('deal_partners')
            .select('*')
            .eq('deal_id', deal.id);

          return {
            ...deal,
            partners: partners || []
          };
        })
      );

      setDeals(dealsWithPartners);
    } catch (error: any) {
      console.error('Erro ao buscar deals:', error);
      toast.error('Erro ao carregar negociações');
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async (dealData: {
    client_id?: string;
    property_id?: string;
    offer_amount?: number;
    commission_amount?: number;
    status?: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          ...dealData
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Negociação criada com sucesso');
      await fetchDeals();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar deal:', error);
      toast.error('Erro ao criar negociação');
      return null;
    }
  };

  const updateDeal = async (dealId: string, updates: Partial<Deal>) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', dealId);

      if (error) throw error;

      toast.success('Negociação atualizada');
      await fetchDeals();
    } catch (error: any) {
      console.error('Erro ao atualizar deal:', error);
      toast.error('Erro ao atualizar negociação');
    }
  };

  const addPartner = async (dealId: string, partner: {
    partner_name: string;
    partner_email?: string;
    partner_phone?: string;
    partner_role: 'broker' | 'investor' | 'consultant' | 'lawyer' | 'other';
    commission_percentage?: number;
    notes?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('deal_partners')
        .insert({
          deal_id: dealId,
          added_by: user.id,
          ...partner
        });

      if (error) throw error;

      toast.success('Parceiro adicionado com sucesso');
      await fetchDeals();
    } catch (error: any) {
      console.error('Erro ao adicionar parceiro:', error);
      toast.error('Erro ao adicionar parceiro');
    }
  };

  const removePartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('deal_partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Parceiro removido');
      await fetchDeals();
    } catch (error: any) {
      console.error('Erro ao remover parceiro:', error);
      toast.error('Erro ao remover parceiro');
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [user]);

  return {
    deals,
    loading,
    createDeal,
    updateDeal,
    addPartner,
    removePartner,
    refetch: fetchDeals
  };
};
