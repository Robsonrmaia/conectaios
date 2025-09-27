import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Users, Trophy, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GamificationStats {
  total_users: number;
  active_brokers: number;
  monthly_points: number;
  total_achievements: number;
}

interface GamificationConfig {
  enabled: boolean;
  point_multiplier: number;
  achievement_system: boolean;
  leaderboard_visible: boolean;
}

interface GamificationFeatureFlagProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function GamificationFeatureFlag({ children, fallback = null }: GamificationFeatureFlagProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(true); // Habilitado por padrão para desenvolvimento
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkGamificationStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkGamificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .maybeSingle();

      const adminStatus = profile?.role === 'admin';
      setIsAdmin(adminStatus);

      // Buscar estatísticas básicas dos brokers existentes
      const { data: brokers } = await supabase
        .from('brokers')
        .select('id')
        .limit(100);

      if (brokers) {
        setStats({
          total_users: 0,
          active_brokers: brokers.length || 0,
          monthly_points: 0,
          total_achievements: 0
        });
      }

      // Configuração padrão
      setConfig({
        enabled: true,
        point_multiplier: 1.0,
        achievement_system: true,
        leaderboard_visible: true
      });

    } catch (err: any) {
      console.error('Erro ao verificar gamificação:', err);
      setError(err.message || 'Erro ao carregar status da gamificação');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  // Sempre mostrar o conteúdo em desenvolvimento
  return <>{children}</>;
}

function GamificationAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkGamificationStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkGamificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .maybeSingle();

      const adminStatus = profile?.role === 'admin';
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        setLoading(false);
        return;
      }

      // Buscar estatísticas básicas dos brokers existentes
      const { data: brokers } = await supabase
        .from('brokers')
        .select('id')
        .limit(100);

      if (brokers) {
        setStats({
          total_users: 0,
          active_brokers: brokers.length || 0,
          monthly_points: 0,
          total_achievements: 0
        });
      }

      // Configuração padrão
      setConfig({
        enabled: false,
        point_multiplier: 1.0,
        achievement_system: true,
        leaderboard_visible: true
      });

    } catch (err: any) {
      console.error('Erro ao verificar gamificação:', err);
      setError(err.message || 'Erro ao carregar status da gamificação');
    } finally {
      setLoading(false);
    }
  };

  const toggleGamification = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setIsEnabled(!isEnabled);
      await checkGamificationStatus();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar configuração');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando sistema de gamificação...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Faça login para acessar as configurações de gamificação.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAdmin) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Apenas administradores podem gerenciar o sistema de gamificação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Sistema de Gamificação
              </CardTitle>
              <CardDescription>
                Ative e gerencie o sistema de pontos e conquistas para os corretores
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isEnabled ? 'default' : 'secondary'} className="font-medium">
                {isEnabled ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Ativo
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Inativo
                  </>
                )}
              </Badge>
              <Switch
                checked={isEnabled}
                onCheckedChange={toggleGamification}
                disabled={loading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">{stats?.active_brokers || 0}</h3>
              <p className="text-sm text-muted-foreground">Corretores Ativos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold">{stats?.monthly_points || 0}</h3>
              <p className="text-sm text-muted-foreground">Pontos do Mês</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold">{stats?.total_achievements || 0}</h3>
              <p className="text-sm text-muted-foreground">Conquistas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold">{config?.point_multiplier || 1}x</h3>
              <p className="text-sm text-muted-foreground">Multiplicador</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { GamificationFeatureFlag, GamificationAdmin };
export default GamificationFeatureFlag;