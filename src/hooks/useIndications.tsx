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
    if (!broker?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('indication-system', {
        body: {
          action: 'get',
          broker_id: broker.id
        }
      });

      if (error) throw error;

      setIndications(data.indications || []);
      setDiscounts(data.discounts || []);
      
      // Calcular estatísticas
      const totalIndications = data.indications?.length || 0;
      const confirmedIndications = data.indications?.filter((i: Indication) => i.status === 'confirmado').length || 0;
      const totalDiscountApplied = data.discounts?.reduce((sum: number, d: IndicationDiscount) => sum + d.valor_desconto, 0) || 0;
      
      // Calcular desconto do próximo mês
      const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
      const nextMonth = currentMonth + 1;
      const nextMonthConfirmed = data.indications?.filter((i: Indication) => 
        i.status === 'confirmado' && i.mes_recompensa === nextMonth
      ).length || 0;
      
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