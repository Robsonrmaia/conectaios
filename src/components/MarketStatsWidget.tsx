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

  const getTopPerformers = (type: 'property_type' | 'city') => {
    const grouped = stats.reduce((acc, stat) => {
      const key = stat[type];
      if (!key) return acc;
      
      if (!acc[key]) {
        acc[key] = {
          name: key,
          total: 0,
          sold: 0,
          rented: 0,
          avgPrice: 0,
          priceCount: 0
        };
      }
      
      acc[key].total += stat.total_count;
      acc[key].sold += stat.sold_count;
      acc[key].rented += stat.rented_count;
      
      if (stat.avg_price) {
        acc[key].avgPrice += stat.avg_price;
        acc[key].priceCount++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .map((item: any) => ({
        ...item,
        avgPrice: item.priceCount > 0 ? item.avgPrice / item.priceCount : 0,
        successRate: item.total > 0 ? ((item.sold + item.rented) / item.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPropertyType = (type: string) => {
    const types = {
      'apartamento': 'Apartamento',
      'casa': 'Casa',
      'terreno': 'Terreno',
      'comercial': 'Comercial',
      'rural': 'Rural'
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatísticas do Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topPropertyTypes = getTopPerformers('property_type');
  const topCities = getTopPerformers('city');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estatísticas do Mercado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="types" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="types" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Tipos de Imóveis
            </TabsTrigger>
            <TabsTrigger value="cities" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cidades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="mt-4">
            <div className="space-y-3">
              {topPropertyTypes.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Dados insuficientes para análise
                </p>
              ) : (
                topPropertyTypes.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{formatPropertyType(item.name)}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.total} imóveis • {item.sold + item.rented} vendas/aluguéis
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {item.successRate > 20 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {item.successRate.toFixed(1)}%
                        </span>
                      </div>
                      {item.avgPrice > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Média: {formatCurrency(item.avgPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="cities" className="mt-4">
            <div className="space-y-3">
              {topCities.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Dados insuficientes para análise
                </p>
              ) : (
                topCities.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.total} imóveis • {item.sold + item.rented} vendas/aluguéis
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {item.successRate > 20 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {item.successRate.toFixed(1)}%
                        </span>
                      </div>
                      {item.avgPrice > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Média: {formatCurrency(item.avgPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Últimos 7 dias • Atualizado automaticamente
          </p>
        </div>
      </CardContent>
    </Card>
  );
}