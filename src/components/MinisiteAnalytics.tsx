import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Eye, 
  Users, 
  MessageCircle, 
  Phone,
  Globe,
  Calendar,
  Download,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  visits: Array<{ date: string; count: number; unique: number }>;
  topProperties: Array<{ id: string; title: string; views: number }>;
  sources: Array<{ source: string; visits: number; percentage: number }>;
  contacts: Array<{ date: string; count: number; type: string }>;
  performance: {
    totalVisits: number;
    uniqueVisitors: number;
    averageTime: number;
    bounceRate: number;
    contactRate: number;
  };
}

const CHART_COLORS = ['#1CA9C9', '#6DDDEB', '#3B82F6', '#EF4444', '#10B981'];

export function MinisiteAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Simulate analytics data - in production, this would come from a real analytics service
      const mockData: AnalyticsData = {
        visits: [
          { date: '2024-01-01', count: 45, unique: 32 },
          { date: '2024-01-02', count: 52, unique: 38 },
          { date: '2024-01-03', count: 38, unique: 28 },
          { date: '2024-01-04', count: 67, unique: 48 },
          { date: '2024-01-05', count: 55, unique: 41 },
          { date: '2024-01-06', count: 78, unique: 55 },
          { date: '2024-01-07', count: 62, unique: 44 }
        ],
        topProperties: [
          { id: '1', title: 'Apartamento Centro Histórico', views: 234 },
          { id: '2', title: 'Casa Jardim Paulista', views: 187 },
          { id: '3', title: 'Cobertura Vila Madalena', views: 156 },
          { id: '4', title: 'Studio Pinheiros', views: 143 },
          { id: '5', title: 'Loft Itaim Bibi', views: 98 }
        ],
        sources: [
          { source: 'Busca Direta', visits: 145, percentage: 35 },
          { source: 'Instagram', visits: 89, percentage: 22 },
          { source: 'WhatsApp', visits: 76, percentage: 18 },
          { source: 'Facebook', visits: 52, percentage: 13 },
          { source: 'Google', visits: 48, percentage: 12 }
        ],
        contacts: [
          { date: '2024-01-01', count: 3, type: 'whatsapp' },
          { date: '2024-01-02', count: 5, type: 'form' },
          { date: '2024-01-03', count: 2, type: 'phone' },
          { date: '2024-01-04', count: 7, type: 'whatsapp' },
          { date: '2024-01-05', count: 4, type: 'form' },
          { date: '2024-01-06', count: 8, type: 'whatsapp' },
          { date: '2024-01-07', count: 6, type: 'form' }
        ],
        performance: {
          totalVisits: 397,
          uniqueVisitors: 286,
          averageTime: 185, // seconds
          bounceRate: 0.32,
          contactRate: 0.087
        }
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

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Visitas,Visitantes Únicos\n"
      + data.visits.map(row => `${row.date},${row.count},${row.unique}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analytics_minisite.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Dados Exportados",
      description: "Arquivo CSV baixado com sucesso.",
    });
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics do Mini Site</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics do Mini Site</h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho do seu mini site
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">3 meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visitas Totais</p>
                <p className="text-2xl font-bold">{data.performance.totalVisits.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12%</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visitantes Únicos</p>
                <p className="text-2xl font-bold">{data.performance.uniqueVisitors.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+8%</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{Math.floor(data.performance.averageTime / 60)}m {data.performance.averageTime % 60}s</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+5%</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Contato</p>
                <p className="text-2xl font-bold">{(data.performance.contactRate * 100).toFixed(1)}%</p>
              </div>
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+3%</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Tráfego</TabsTrigger>
          <TabsTrigger value="properties">Imóveis</TabsTrigger>
          <TabsTrigger value="sources">Origem</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitas por Dia</CardTitle>
              <CardDescription>
                Acompanhe o tráfego diário do seu mini site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.visits}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#1CA9C9" 
                    name="Total de Visitas"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unique" 
                    stroke="#6DDDEB" 
                    name="Visitantes Únicos"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Imóveis Mais Visualizados</CardTitle>
              <CardDescription>
                Os imóveis que mais despertam interesse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topProperties.map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{property.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{property.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Origem das Visitas</CardTitle>
                <CardDescription>
                  De onde vêm seus visitantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="visits"
                    >
                      {data.sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.sources.map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-sm">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{source.visits}</div>
                        <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contatos Recebidos</CardTitle>
              <CardDescription>
                Leads gerados pelo seu mini site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.contacts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1CA9C9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}