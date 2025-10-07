import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Proposal {
  id: string;
  property_id: string;
  broker_id: string;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  offer_amount: number;
  financing_type: string;
  down_payment: number | null;
  financing_amount: number | null;
  conditions: string | null;
  message: string | null;
  expires_at: string | null;
  status: 'active' | 'accepted' | 'rejected' | 'expired' | 'countered';
  created_at: string;
  updated_at: string;
  property?: {
    title: string;
    price: number;
    reference_code: string;
  };
  counter_proposals?: CounterProposal[];
}

export interface CounterProposal {
  id: string;
  proposal_id: string;
  created_by: string;
  offer_amount: number;
  down_payment: number | null;
  financing_amount: number | null;
  conditions: string | null;
  message: string | null;
  expires_at: string | null;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
}

export const useProposals = (propertyId?: string) => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('property_proposals')
        .select(`
          *,
          property:imoveis(title, price, reference_code)
        `)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar contrapropostas para cada proposta
      const proposalsWithCounters = await Promise.all(
        (data || []).map(async (proposal) => {
          const { data: counters } = await supabase
            .from('counter_proposals')
            .select('*')
            .eq('proposal_id', proposal.id)
            .order('created_at', { ascending: false });

          return {
            ...proposal,
            counter_proposals: counters || []
          };
        })
      );

      setProposals(proposalsWithCounters);
    } catch (error: any) {
      console.error('Erro ao buscar propostas:', error);
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async (proposalData: {
    property_id: string;
    buyer_name: string;
    buyer_email?: string;
    buyer_phone?: string;
    offer_amount: number;
    financing_type?: string;
    down_payment?: number;
    financing_amount?: number;
    conditions?: string;
    message?: string;
    expires_at?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('property_proposals')
        .insert({
          broker_id: user.id,
          ...proposalData
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Proposta criada com sucesso');
      await fetchProposals();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar proposta:', error);
      toast.error('Erro ao criar proposta');
      return null;
    }
  };

  const createCounterProposal = async (proposalId: string, counterData: {
    offer_amount: number;
    down_payment?: number;
    financing_amount?: number;
    conditions?: string;
    message?: string;
    expires_at?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('counter_proposals')
        .insert({
          proposal_id: proposalId,
          created_by: user.id,
          ...counterData
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar status da proposta para 'countered'
      await supabase
        .from('property_proposals')
        .update({ status: 'countered' })
        .eq('id', proposalId);

      toast.success('Contraproposta enviada com sucesso');
      await fetchProposals();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar contraproposta:', error);
      toast.error('Erro ao criar contraproposta');
      return null;
    }
  };

  const updateProposalStatus = async (proposalId: string, status: Proposal['status']) => {
    try {
      const { error } = await supabase
        .from('property_proposals')
        .update({ status })
        .eq('id', proposalId);

      if (error) throw error;

      toast.success('Status atualizado');
      await fetchProposals();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [user, propertyId]);

  return {
    proposals,
    loading,
    createProposal,
    createCounterProposal,
    updateProposalStatus,
    refetch: fetchProposals
  };
};
