import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  MessageSquare,
  DollarSign,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface AdminAnalyticsData {
  userGrowth: Array<{ month: string; total: number; new: number }>;
  propertyStats: Array<{ type: string; count: number; growth: number }>;
  dealMetrics: {
    totalValue: number;
    totalDeals: number;
    avgDealValue: number;
    conversionRate: number;
  };
  systemUsage: Array<{ feature: string; usage: number; growth: number }>;
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3m');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Mock data - Em produção viria do Supabase
      const mockData: AdminAnalyticsData = {
        userGrowth: [
          { month: 'Out', total: 980, new: 120 },
          { month: 'Nov', total: 1100, new: 140 },
          { month: 'Dez', total: 1180, new: 95 },
          { month: 'Jan', total: 1247, new: 87 },
        ],
        propertyStats: [
          { type: 'Apartamentos', count: 1543, growth: 12.5 },
          { type: 'Casas', count: 892, growth: 8.7 },
          { type: 'Comercial', count: 234, growth: 15.2 },
          { type: 'Terrenos', count: 187, growth: -3.4 },
        ],
        dealMetrics: {
          totalValue: 45800000,
          totalDeals: 234,
          avgDealValue: 395726,
          conversionRate: 12.8,
        },
        systemUsage: [
          { feature: 'CRM', usage: 87, growth: 5.2 },
          { feature: 'Minisite', usage: 65, growth: 18.7 },
          { feature: 'Messaging', usage: 92, growth: 2.1 },
          { feature: 'Virtual Staging', usage: 43, growth: 24.6 },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de analytics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;

    const csv = `Data,Novos Usuarios,Total Usuarios
${data.userGrowth.map(item => `${item.month},${item.new},${item.total}`).join('\n')}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analytics_admin.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Dados de analytics exportados com sucesso.",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem dados disponíveis</h3>
            <p className="text-muted-foreground">Não foi possível carregar os dados de analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-success';
    if (growth < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const TrendIcon = ({ growth }: { growth: number }) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics da Plataforma</h2>
          <p className="text-muted-foreground">Métricas e estatísticas gerais do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Mês</SelectItem>
              <SelectItem value="3m">3 Meses</SelectItem>
              <SelectItem value="6m">6 Meses</SelectItem>
              <SelectItem value="1y">1 Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas de Negócios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">
                  R$ {(data.dealMetrics.totalValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-muted-foreground">Volume Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{data.dealMetrics.totalDeals}</div>
                <div className="text-sm text-muted-foreground">Negócios Fechados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-warning">
                  R$ {(data.dealMetrics.avgDealValue / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-muted-foreground">Ticket Médio</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{data.dealMetrics.conversionRate}%</div>
                <div className="text-sm text-muted-foreground">Taxa Conversão</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crescimento de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Crescimento de Usuários
            </CardTitle>
            <CardDescription>Evolução mensal da base de usuários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-48">
              {data.userGrowth.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="relative w-full">
                    <div
                      className="bg-primary/30 rounded-t w-full"
                      style={{ height: `${(item.total / 1300) * 160}px` }}
                    />
                    <div
                      className="bg-primary rounded-t w-full absolute bottom-0"
                      style={{ height: `${(item.new / 150) * 160}px` }}
                    />
                  </div>
                  <div className="text-sm font-medium mt-2">{item.month}</div>
                  <div className="text-xs text-muted-foreground">
                    +{item.new} / {item.total}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                <span>Novos Usuários</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/30 rounded" />
                <span>Total Acumulado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Imóveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Imóveis por Tipo
            </CardTitle>
            <CardDescription>Distribuição e crescimento por categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.propertyStats.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{item.type}</div>
                  <Badge variant="outline">{item.count.toLocaleString()}</Badge>
                </div>
                <div className={`flex items-center gap-2 ${getTrendColor(item.growth)}`}>
                  <TrendIcon growth={item.growth} />
                  <span className="text-sm font-medium">
                    {item.growth > 0 ? '+' : ''}{item.growth}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Uso do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Uso de Funcionalidades</CardTitle>
          <CardDescription>Taxa de adoção e crescimento das principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.systemUsage.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.feature}</span>
                  <div className={`flex items-center gap-1 ${getTrendColor(item.growth)}`}>
                    <TrendIcon growth={item.growth} />
                    <span className="text-xs">
                      {item.growth > 0 ? '+' : ''}{item.growth}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${item.usage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{item.usage}% dos usuários</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}