import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Building2, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Database,
  Activity,
  BarChart3,
  UserCheck,
  Building,
  MessageSquare
} from 'lucide-react';

export default function Admin() {
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalProperties: 3456,
    totalDeals: 234,
    monthlyGrowth: 12.5
  };

  const recentActivities = [
    {
      id: 1,
      type: 'user_signup',
      description: 'Novo usuário cadastrado: Maria Santos',
      timestamp: '2024-01-31 14:30',
      severity: 'info'
    },
    {
      id: 2,
      type: 'property_added',
      description: 'Novo imóvel adicionado: Apartamento Jardins',
      timestamp: '2024-01-31 13:45',
      severity: 'info'
    },
    {
      id: 3,
      type: 'error',
      description: 'Erro na integração com API externa',
      timestamp: '2024-01-31 12:15',
      severity: 'error'
    },
    {
      id: 4,
      type: 'deal_closed',
      description: 'Negócio finalizado: R$ 850.000',
      timestamp: '2024-01-31 11:30',
      severity: 'success'
    }
  ];

  const systemHealth = [
    {
      service: 'API Principal',
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms'
    },
    {
      service: 'Banco de Dados',
      status: 'healthy',
      uptime: '99.8%',
      responseTime: '45ms'
    },
    {
      service: 'Serviço de Email',
      status: 'warning',
      uptime: '98.5%',
      responseTime: '300ms'
    },
    {
      service: 'Integração CRM',
      status: 'healthy',
      uptime: '99.7%',
      responseTime: '180ms'
    }
  ];

  const userAnalytics = [
    { month: 'Out', users: 980 },
    { month: 'Nov', users: 1100 },
    { month: 'Dez', users: 1180 },
    { month: 'Jan', users: 1247 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success/20 text-success';
      case 'warning': return 'bg-warning/20 text-warning';
      case 'error': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'border-l-success bg-success/5';
      case 'warning': return 'border-l-warning bg-warning/5';
      case 'error': return 'border-l-destructive bg-destructive/5';
      default: return 'border-l-muted bg-muted/5';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Administração
          </h1>
          <p className="text-muted-foreground">
            Painel administrativo da plataforma ConectaIOS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <Badge className="bg-primary/20 text-primary">Admin</Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Usuários</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{stats.activeUsers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold text-warning">{stats.totalProperties.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Imóveis</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <div className="text-sm text-muted-foreground">Negócios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">+{stats.monthlyGrowth}%</div>
                <div className="text-sm text-muted-foreground">Crescimento</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-3 border-l-2 rounded-r-lg ${getSeverityColor(activity.severity)}`}
                  >
                    <div className="font-medium text-sm">{activity.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{activity.timestamp}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemHealth.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{service.service}</div>
                      <div className="text-sm text-muted-foreground">
                        Uptime: {service.uptime} | Resposta: {service.responseTime}
                      </div>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status === 'healthy' ? 'Saudável' :
                       service.status === 'warning' ? 'Atenção' : 'Erro'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Crescimento de Usuários
              </CardTitle>
              <CardDescription>
                Evolução do número de usuários nos últimos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-32">
                {userAnalytics.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-primary rounded-t w-12 min-h-[20px]"
                      style={{ height: `${(data.users / 1300) * 100}%` }}
                    />
                    <div className="text-sm font-medium mt-2">{data.month}</div>
                    <div className="text-xs text-muted-foreground">{data.users}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>
                Gerencie usuários, permissões e acessos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  Ver Todos os Usuários
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <UserCheck className="h-6 w-6" />
                  Usuários Ativos
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Shield className="h-6 w-6" />
                  Permissões
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento do Sistema</CardTitle>
              <CardDescription>
                Monitore performance, logs e integrações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Activity className="h-6 w-6" />
                  Logs do Sistema
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Database className="h-6 w-6" />
                  Status dos Serviços
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  Alertas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configure parâmetros globais da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 justify-start">
                  <Building className="h-5 w-5 mr-3" />
                  Configurações Gerais
                </Button>
                <Button variant="outline" className="h-16 justify-start">
                  <MessageSquare className="h-5 w-5 mr-3" />
                  Templates de Email
                </Button>
                <Button variant="outline" className="h-16 justify-start">
                  <Settings className="h-5 w-5 mr-3" />
                  Integrações
                </Button>
                <Button variant="outline" className="h-16 justify-start">
                  <Shield className="h-5 w-5 mr-3" />
                  Segurança
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}