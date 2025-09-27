import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Home, Users, DollarSign } from 'lucide-react';

interface MarketStat {
  period_start: string;
  period_end: string;
  property_type: string;
  listing_type: string;
  avg_price: number;
  total_listings: number;
  avg_days_on_market: number;
  price_change_percent: number;
  total_sales: number;
  avg_sale_price: number;
  market_velocity: number;
}

export function MarketStatsWidget() {
  const [stats, setStats] = useState<MarketStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketStats();
  }, []);

  const fetchMarketStats = async () => {
    try {
      setLoading(true);
      
      // Mock data until market_stats table is implemented
      const mockStats: MarketStat[] = [
        {
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          property_type: 'apartment',
          listing_type: 'sale',
          avg_price: 450000,
          total_listings: 1250,
          avg_days_on_market: 45,
          price_change_percent: 3.2,
          total_sales: 180,
          avg_sale_price: 435000,
          market_velocity: 0.85
        },
        {
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          property_type: 'house',
          listing_type: 'sale',
          avg_price: 750000,
          total_listings: 890,
          avg_days_on_market: 62,
          price_change_percent: 1.8,
          total_sales: 120,
          avg_sale_price: 720000,
          market_velocity: 0.72
        }
      ];

      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching market stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando estatísticas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.property_type === 'apartment' ? 'Apartamentos' : 'Casas'}
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stat.avg_price / 1000).toFixed(0)}k
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stat.price_change_percent > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(stat.price_change_percent)}% este mês
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Anúncios</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.reduce((acc, stat) => acc + stat.total_listings, 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Ativos no mercado
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.reduce((acc, stat) => acc + stat.total_sales, 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Transações concluídas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}