import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Activity, CheckCircle, Clock, DollarSign, TrendingUp, Users, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricsData {
  total_subscriptions: number;
  active_subscriptions: number;
  overdue_subscriptions: number;
  cancelled_subscriptions: number;
  total_revenue: number;
  monthly_revenue: number;
  average_ticket: number;
}

export function AsaasSubscriptionMetrics() {
  const { isAdmin } = useAdminAuth();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Buscar todas as assinaturas
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('status, value, created_at');

      if (error) throw error;

      // Calcular métricas
      const total = subscriptions?.length || 0;
      const active = subscriptions?.filter(s => s.status === 'ACTIVE').length || 0;
      const overdue = subscriptions?.filter(s => s.status === 'OVERDUE').length || 0;
      const cancelled = subscriptions?.filter(s => s.status === 'CANCELLED').length || 0;

      const totalRevenue = subscriptions?.reduce((sum, s) => sum + (s.value || 0), 0) || 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = subscriptions
        ?.filter(s => {
          const subDate = new Date(s.created_at);
          return subDate.getMonth() === currentMonth && subDate.getFullYear() === currentYear;
        })
        .reduce((sum, s) => sum + (s.value || 0), 0) || 0;

      const avgTicket = total > 0 ? totalRevenue / total : 0;

      setMetrics({
        total_subscriptions: total,
        active_subscriptions: active,
        overdue_subscriptions: overdue,
        cancelled_subscriptions: cancelled,
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        average_ticket: avgTicket
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>Apenas administradores podem ver estas métricas.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="h-3 w-[80px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const metricsCards = [
    {
      title: 'Total de Assinaturas',
      value: metrics.total_subscriptions,
      icon: Users,
      description: 'Todas as assinaturas'
    },
    {
      title: 'Assinaturas Ativas',
      value: metrics.active_subscriptions,
      icon: CheckCircle,
      description: `${((metrics.active_subscriptions / metrics.total_subscriptions) * 100 || 0).toFixed(1)}% do total`,
      color: 'text-green-600'
    },
    {
      title: 'Em Atraso',
      value: metrics.overdue_subscriptions,
      icon: Clock,
      description: `${((metrics.overdue_subscriptions / metrics.total_subscriptions) * 100 || 0).toFixed(1)}% do total`,
      color: 'text-yellow-600'
    },
    {
      title: 'Canceladas',
      value: metrics.cancelled_subscriptions,
      icon: XCircle,
      description: `${((metrics.cancelled_subscriptions / metrics.total_subscriptions) * 100 || 0).toFixed(1)}% do total`,
      color: 'text-red-600'
    },
    {
      title: 'Receita Total',
      value: `R$ ${metrics.total_revenue.toFixed(2)}`,
      icon: DollarSign,
      description: 'Acumulado',
      color: 'text-primary'
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${metrics.monthly_revenue.toFixed(2)}`,
      icon: TrendingUp,
      description: 'Mês atual',
      color: 'text-primary'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${metrics.average_ticket.toFixed(2)}`,
      icon: Activity,
      description: 'Por assinatura'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricsCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color || ''}`}>{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
