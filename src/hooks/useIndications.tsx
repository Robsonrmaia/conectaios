import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from './useBroker';
import { toast } from '@/hooks/use-toast';

interface Indication {
  id: string;
  id_indicador: string;
  id_indicado: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  mes_recompensa: number;
  data_criacao: string;
  data_confirmacao?: string;
  codigo_indicacao: string;
  desconto_aplicado: number;
  indicador?: {
    id: string;
    name: string;
    username: string;
  };
  indicado?: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
}

interface IndicationDiscount {
  id: string;
  broker_id: string;
  mes_aplicacao: number;
  tipo_desconto: 'indicador_50' | 'indicado_50' | 'zeramento_100';
  valor_original: number;
  valor_desconto: number;
  valor_final: number;
  aplicado_em: string;
}

export function useIndications() {
  const { broker } = useBroker();
  const [indications, setIndications] = useState<Indication[]>([]);
  const [discounts, setDiscounts] = useState<IndicationDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalIndications: 0,
    confirmedIndications: 0,
    totalDiscountApplied: 0,
    nextMonthDiscount: 0
  });

  const fetchIndications = async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;

    setLoading(true);
    try {
      if (import.meta.env.DEV) {
        console.log('📋 Indicações: Loading indications for user:', uid);
      }

      // Direct query to indications table using referrer_id = auth.uid()
      const { data: indicationsData, error: indicationsError } = await supabase
        .from('indications')
        .select(`
          id,
          referrer_id,
          referred_id,
          referred_email,
          status,
          created_at,
          updated_at,
          reward_amount,
          reward_claimed
        `)
        .eq('referrer_id', uid)
        .order('created_at', { ascending: false });

      if (indicationsError) {
        if (import.meta.env.DEV) {
          console.error('❌ Indicações fetch error:', indicationsError);
        }
        throw indicationsError;
      }

      // Query discounts related to indications
      const { data: discountsData, error: discountsError } = await supabase
        .from('indication_discounts')
        .select('*')
        .in('indication_id', indicationsData?.map(i => i.id) || []);

      if (discountsError && import.meta.env.DEV) {
        console.log('⚠️ Indicações: Could not load discounts:', discountsError);
      }

      if (import.meta.env.DEV) {
        console.log('✅ Indicações: Loaded', indicationsData?.length || 0, 'indications');
      }

      // Transform data to match interface
      const transformedIndications: Indication[] = (indicationsData || []).map(ind => ({
        id: ind.id,
        id_indicador: ind.referrer_id,
        id_indicado: ind.referred_id || '',
        status: (ind.status === 'confirmed' ? 'confirmado' : (ind.status === 'cancelled' ? 'cancelado' : 'pendente')) as 'pendente' | 'confirmado' | 'cancelado',
        mes_recompensa: 0, // Will be calculated based on dates
        data_criacao: ind.created_at,
        data_confirmacao: ind.updated_at,
        codigo_indicacao: broker?.referral_code || '',
        desconto_aplicado: ind.reward_amount || 0,
        indicado: {
          id: ind.referred_id || '',
          name: 'Nome não informado',
          username: '',
          email: ind.referred_email || ''
        }
      }));

      setIndications(transformedIndications);
      setDiscounts(discountsData || []);
      
      // Calcular estatísticas  
      const totalIndications = transformedIndications.length;
      const confirmedIndications = transformedIndications.filter((i) => i.status === 'confirmado').length;
      const totalDiscountApplied = (discountsData || []).reduce((sum: number, d: any) => sum + (d.discount_amount || 0), 0);
      
      // Calcular desconto do próximo mês
      const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
      const nextMonth = currentMonth + 1;
      const nextMonthConfirmed = transformedIndications.filter((i) => 
        i.status === 'confirmado' && i.mes_recompensa === nextMonth
      ).length;
      
      let nextMonthDiscount = 0;
      if (nextMonthConfirmed >= 2) {
        nextMonthDiscount = 100; // Zeramento
      } else if (nextMonthConfirmed === 1) {
        nextMonthDiscount = 50; // 50% de desconto
      }

      setStats({
        totalIndications,
        confirmedIndications,
        totalDiscountApplied,
        nextMonthDiscount
      });

    } catch (error) {
      console.error('Error fetching indications:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as indicações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createIndication = async (referralCode: string, indicatedBrokerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('indication-system', {
        body: {
          action: 'create',
          referral_code: referralCode,
          indicated_broker_id: indicatedBrokerId
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: data.message || 'Indicação criada com sucesso!'
      });

      await fetchIndications();
      return data;
    } catch (error: any) {
      console.error('Error creating indication:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar indicação',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const confirmIndication = async (indicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('indication-system', {
        body: {
          action: 'confirm',
          indication_id: indicationId
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Indicação confirmada com sucesso!'
      });

      await fetchIndications();
      return data;
    } catch (error: any) {
      console.error('Error confirming indication:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao confirmar indicação',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const generateReferralLink = () => {
    if (!broker?.referral_code) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${broker.referral_code}`;
  };

  const generateWhatsAppMessage = () => {
    const link = generateReferralLink();
    const message = `🎯 Quer economizar na sua ferramenta imobiliária?\n\n💰 Use meu código de indicação e ganhe 50% de desconto no primeiro mês da ConectaIOS!\n\n🔗 Cadastre-se aqui: ${link}\n\n✨ A ConectaIOS é a plataforma completa para corretores: CRM, gestão de imóveis, IA integrada e muito mais!`;
    return encodeURIComponent(message);
  };

  useEffect(() => {
    fetchIndications();
  }, [broker?.id]);

  return {
    indications,
    discounts,
    stats,
    loading,
    createIndication,
    confirmIndication,
    generateReferralLink,
    generateWhatsAppMessage,
    refreshIndications: fetchIndications
  };
}