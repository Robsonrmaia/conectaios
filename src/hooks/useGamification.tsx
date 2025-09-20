import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/hooks/use-toast';

interface GamificationStats {
  pontos: number;
  tier: string;
  desconto_percent: number;
  badges: string[];
  current_rank: number;
  total_users: number;
  updated_at?: string;
}

interface GamificationEvent {
  id: string;
  rule_key: string;
  pontos: number;
  ref_tipo: string;
  ref_id: string;
  meta: Record<string, any>;
  created_at: string;
}

interface LeaderboardEntry {
  pontos: number;
  tier: string;
  badges: string[];
  conectaios_brokers: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

interface PropertyQuality {
  imovel_id: string;
  percentual: number;
  tem_8_fotos: boolean;
  updated_at: string;
}

interface PointsRule {
  key: string;
  label: string;
  pontos: number;
  descricao: string;
}

interface BadgeDefinition {
  slug: string;
  label: string;
  descricao: string;
  icone: string;
  prioridade: number;
}

export function useGamification() {
  const { broker } = useBroker();
  const [stats, setStats] = useState<GamificationStats>({
    pontos: 0,
    tier: 'Sem Desconto',
    desconto_percent: 0,
    badges: [],
    current_rank: 0,
    total_users: 0
  });
  const [recentEvents, setRecentEvents] = useState<GamificationEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [propertyQualities, setPropertyQualities] = useState<PropertyQuality[]>([]);
  const [pointsRules, setPointsRules] = useState<PointsRule[]>([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user stats and recent events
  const fetchUserStats = async () => {
    if (!broker?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'get_user_stats',
          usuario_id: broker.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setStats({
          pontos: data.monthly_data.pontos,
          tier: data.monthly_data.tier,
          desconto_percent: data.monthly_data.desconto_percent,
          badges: data.monthly_data.badges || [],
          current_rank: data.current_rank,
          total_users: data.total_users,
          updated_at: data.monthly_data.updated_at
        });
        setRecentEvents(data.recent_events);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas estatísticas de gamificação',
        variant: 'destructive'
      });
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: { action: 'get_leaderboard' }
      });

      if (error) throw error;

      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  // Fetch property qualities for current user
  const fetchPropertyQualities = async () => {
    if (!broker?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('imoveis_quality')
        .select('*')
        .eq('corretor_id', broker.id)
        .order('percentual', { ascending: false });

      if (error) throw error;
      setPropertyQualities(data || []);
    } catch (error) {
      console.error('Error fetching property qualities:', error);
    }
  };

  // Fetch points rules
  const fetchPointsRules = async () => {
    console.log('🎯 fetchPointsRules: Starting fetch...');
    console.log('🎯 Current broker:', broker);
    
    try {
      console.log('🎯 Making supabase query to gam_points_rules...');
      
      const { data, error } = await supabase
        .from('gam_points_rules')
        .select('*')
        .eq('ativo', true)
        .order('pontos', { ascending: false });

      console.log('🎯 Supabase response:', { data, error });
      console.log('🎯 Data length:', data?.length || 0);

      if (error) {
        console.error('🎯 Supabase error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('🎯 Setting pointsRules:', data);
        setPointsRules(data);
        toast({
          title: 'Regras carregadas',
          description: `${data.length} regras de pontuação carregadas com sucesso`,
        });
      } else {
        console.warn('🎯 No rules found in database');
        setPointsRules([]);
        toast({
          title: 'Aviso',
          description: 'Nenhuma regra de pontuação encontrada no banco de dados',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('🎯 Error fetching points rules:', error);
      setPointsRules([]);
      toast({
        title: 'Erro ao carregar regras',
        description: `Erro: ${error.message || 'Erro desconhecido'}. Tentando novamente...`,
        variant: 'destructive'
      });
      
      // Retry after 2 seconds
      setTimeout(() => {
        console.log('🎯 Retrying fetchPointsRules...');
        fetchPointsRules();
      }, 2000);
    }
  };

  // Fetch badge definitions
  const fetchBadgeDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from('gam_badges')
        .select('*')
        .order('prioridade', { ascending: false });

      if (error) throw error;
      setBadgeDefinitions(data || []);
    } catch (error) {
      console.error('Error fetching badge definitions:', error);
    }
  };

  // Add points manually (for testing or admin use)
  const addPoints = async (rule_key: string, pontos: number, ref_tipo?: string, ref_id?: string, meta?: Record<string, any>) => {
    if (!broker?.id) return false;

    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'add_points',
          usuario_id: broker.id,
          rule_key,
          pontos,
          ref_tipo,
          ref_id,
          meta
        }
      });

      if (error) throw error;

      if (data.success) {
        await fetchUserStats(); // Refresh stats
        toast({
          title: 'Pontos adicionados!',
          description: `Você ganhou ${pontos} pontos por ${rule_key}`
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding points:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar pontos',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Check property quality and award points if applicable
  const checkPropertyQuality = async (property_id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'check_property_quality',
          ref_id: property_id
        }
      });

      if (error) throw error;

      if (data.success && data.events_created > 0) {
        await fetchUserStats(); // Refresh stats
        toast({
          title: 'Pontos de qualidade!',
          description: `Imóvel com ${data.quality_score}% de qualidade rendeu pontos!`
        });
      }
      return data;
    } catch (error) {
      console.error('Error checking property quality:', error);
      return null;
    }
  };

  // Process match response time
  const processMatchResponse = async (match_id: string, response_time_seconds: number) => {
    if (!broker?.id) return false;

    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'process_match_response',
          ref_id: match_id,
          meta: {
            usuario_id: broker.id,
            response_time_seconds
          }
        }
      });

      if (error) throw error;

      if (data.success && data.points_awarded > 0) {
        await fetchUserStats(); // Refresh stats
        toast({
          title: 'Resposta rápida!',
          description: `Você ganhou ${data.points_awarded} pontos por resposta rápida`
        });
      }
      return data;
    } catch (error) {
      console.error('Error processing match response:', error);
      return null;
    }
  };

  // Process property sold
  const processPropertySold = async (property_id: string) => {
    if (!broker?.id) return false;

    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'process_property_sold',
          ref_id: property_id,
          usuario_id: broker.id
        }
      });

      if (error) throw error;

      if (data.success) {
        await fetchUserStats(); // Refresh stats
        toast({
          title: 'Negócio fechado!',
          description: `Você ganhou ${data.points_awarded} pontos por fechar negócio!`
        });
      }
      return data;
    } catch (error) {
      console.error('Error processing property sold:', error);
      return null;
    }
  };

  // Add social interaction
  const addSocialInteraction = async (interaction_type: 'share' | 'like' | 'comment', ref_id?: string, meta?: Record<string, any>) => {
    if (!broker?.id) return false;

    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'add_social_interaction',
          usuario_id: broker.id,
          meta: {
            interaction_type,
            ref_id,
            ...meta
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        await fetchUserStats(); // Refresh stats
        if (data.points_awarded > 0) {
          toast({
            title: 'Interação social!',
            description: `Você ganhou ${data.points_awarded} pontos por interação social`
          });
        }
      }
      return data;
    } catch (error) {
      console.error('Error adding social interaction:', error);
      return null;
    }
  };

  // Get tier info
  const getTierInfo = (tier: string) => {
    const tiers = {
      'Sem Desconto': { 
        color: 'text-muted-foreground', 
        bgColor: 'bg-muted', 
        minPoints: 0, 
        maxPoints: 299,
        description: 'Participe mais para ganhar descontos!'
      },
      'Participativo': { 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100', 
        minPoints: 300, 
        maxPoints: 599,
        description: '10% de desconto na mensalidade'
      },
      'Premium': { 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-100', 
        minPoints: 600, 
        maxPoints: 899,
        description: '25% de desconto na mensalidade'
      },
      'Elite': { 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100', 
        minPoints: 900, 
        maxPoints: Infinity,
        description: '50% de desconto na mensalidade'
      }
    };
    return tiers[tier as keyof typeof tiers] || tiers['Sem Desconto'];
  };

  // Get badge info
  const getBadgeInfo = (badgeSlug: string) => {
    return badgeDefinitions.find(badge => badge.slug === badgeSlug);
  };

  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    const currentTierInfo = getTierInfo(stats.tier);
    const currentPoints = stats.pontos;
    
    if (currentTierInfo.maxPoints === Infinity) {
      return { percentage: 100, pointsNeeded: 0, nextTier: null };
    }

    const nextTierMinPoints = currentTierInfo.maxPoints + 1;
    const pointsInCurrentTier = currentPoints - currentTierInfo.minPoints;
    const pointsNeededForTier = currentTierInfo.maxPoints - currentTierInfo.minPoints + 1;
    const percentage = Math.min((pointsInCurrentTier / pointsNeededForTier) * 100, 100);
    const pointsNeeded = Math.max(nextTierMinPoints - currentPoints, 0);

    let nextTier = null;
    if (nextTierMinPoints <= 299) nextTier = 'Sem Desconto';
    else if (nextTierMinPoints <= 599) nextTier = 'Participativo';
    else if (nextTierMinPoints <= 899) nextTier = 'Premium';
    else nextTier = 'Elite';

    return { percentage, pointsNeeded, nextTier };
  };

  // Load all data
  const loadData = async () => {
    console.log('🎯 loadData: Starting data load...');
    setLoading(true);
    try {
      console.log('🎯 loadData: Running parallel data fetches...');
      await Promise.all([
        fetchUserStats(),
        fetchLeaderboard(),
        fetchPropertyQualities(),
        fetchPointsRules(),
        fetchBadgeDefinitions()
      ]);
      console.log('🎯 loadData: All data loaded successfully');
    } catch (error) {
      console.error('🎯 loadData: Error during data load:', error);
    } finally {
      console.log('🎯 loadData: Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (broker?.id) {
      loadData();
    }
  }, [broker?.id]);

  return {
    stats,
    recentEvents,
    leaderboard,
    propertyQualities,
    pointsRules,
    badgeDefinitions,
    loading,
    // Actions
    addPoints,
    checkPropertyQuality,
    processMatchResponse,
    processPropertySold,
    addSocialInteraction,
    // Utilities
    getTierInfo,
    getBadgeInfo,
    getProgressToNextTier,
    // Refresh data
    refreshStats: fetchUserStats,
    refreshLeaderboard: fetchLeaderboard,
    refreshData: loadData
  };
}