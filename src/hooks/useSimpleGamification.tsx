import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GamificationStats {
  pontos: number;
  tier: string;
  desconto_percent: number;
  badges: string[];
  current_rank?: number;
  total_users?: number;
}

interface GamificationEvent {
  id: string;
  rule_key: string;
  pontos: number;
  created_at: string;
}

interface LeaderboardEntry {
  pontos: number;
  tier: string;
  badges: string[];
  conectaios_brokers: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export function useSimpleGamification(brokerId?: string) {
  const [stats, setStats] = useState<GamificationStats>({
    pontos: 0,
    tier: 'Sem Desconto',
    desconto_percent: 0,
    badges: []
  });
  const [recentEvents, setRecentEvents] = useState<GamificationEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserStats = async () => {
    if (!brokerId) return;
    
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Buscar estatísticas do usuário
      const { data: monthlyData } = await supabase
        .from('gam_user_monthly')
        .select('*')
        .eq('usuario_id', brokerId)
        .eq('ano', currentYear)
        .eq('mes', currentMonth)
        .single();

      if (monthlyData) {
        setStats({
          pontos: monthlyData.pontos || 0,
          tier: monthlyData.tier || 'Sem Desconto',
          desconto_percent: monthlyData.desconto_percent || 0,
          badges: Array.isArray(monthlyData.badges) ? (monthlyData.badges as string[]) : []
        });
      }

      // Buscar eventos recentes
      const { data: eventsData } = await supabase
        .from('gam_events')
        .select('id, rule_key, pontos, created_at')
        .eq('usuario_id', brokerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsData) {
        setRecentEvents(eventsData);
      }
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const { data } = await supabase
        .from('gam_user_monthly')
        .select('pontos, tier, badges, usuario_id')
        .eq('ano', currentYear)
        .eq('mes', currentMonth)
        .order('pontos', { ascending: false })
        .limit(10);

      if (data) {
        // Simplificado sem join com conectaios_brokers por enquanto
        const simplifiedLeaderboard = data.map(item => ({
          pontos: item.pontos,
          tier: item.tier,
          badges: Array.isArray(item.badges) ? (item.badges as string[]) : [],
          conectaios_brokers: {
            id: item.usuario_id,
            name: 'Corretor',
            avatar_url: undefined
          }
        }));
        setLeaderboard(simplifiedLeaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const addPoints = async (ruleKey: string, points: number, refType?: string, refId?: string) => {
    if (!brokerId) return false;

    try {
      const { error } = await supabase.rpc('apply_points', {
        p_usuario_id: brokerId,
        p_rule_key: ruleKey,
        p_pontos: points,
        p_ref_tipo: refType || null,
        p_ref_id: refId || null,
        p_meta: {}
      });

      if (!error) {
        // Atualizar stats localmente
        setStats(prev => ({
          ...prev,
          pontos: prev.pontos + points
        }));
        return true;
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
    return false;
  };

  useEffect(() => {
    if (brokerId) {
      fetchUserStats();
      fetchLeaderboard();
    }
  }, [brokerId]);

  return {
    stats,
    recentEvents,
    leaderboard,
    loading,
    fetchUserStats,
    fetchLeaderboard,
    addPoints,
    getTierInfo: (tier: string) => ({ name: tier, color: '#3B82F6', description: 'Nível de corretor' }),
    getBadgeInfo: (badge: string) => ({ name: badge, icon: 'medal', color: '#FFD700', label: badge, descricao: 'Badge conquistado' }),
    getProgressToNextTier: () => ({ 
      current: stats.pontos, 
      needed: 100, 
      percentage: 0,
      nextTier: 'Próximo Nível',
      pointsNeeded: 100 - stats.pontos
    })
  };
}