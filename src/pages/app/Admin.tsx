import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Section, PageWrapper } from '@/components/layout/Section';
import { ScrollableRow, ResponsiveButtonGroup } from '@/components/layout/ResponsiveRow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigate } from 'react-router-dom';
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
import { useAdminAuth } from '@/hooks/useAdminAuth';
import SecureAdminUserManagement from '@/components/SecureAdminUserManagement';
import AdminTestimonialManager from '@/components/AdminTestimonialManager';
import AdminPartnerManager from '@/components/AdminPartnerManager';
import { PropertyTransferAdmin } from '@/components/PropertyTransferAdmin';
import GeneralSettings from '@/components/admin/GeneralSettings';
import MaintenanceSettings from '@/components/admin/MaintenanceSettings';
import EmailTemplates from '@/components/admin/EmailTemplates';
import Integrations from '@/components/admin/Integrations';
import SecuritySettings from '@/components/admin/SecuritySettings';
import SystemLogs from '@/components/admin/SystemLogs';
import SystemStatus from '@/components/admin/SystemStatus';
import SystemAlerts from '@/components/admin/SystemAlerts';
import SupportTicketManager from '@/components/admin/SupportTicketManager';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminDataManager from '@/components/admin/AdminDataManager';
import AuditLogs from '@/pages/app/AuditLogs';
import { AsaasWebhookMonitor } from '@/components/AsaasWebhookMonitor';
import { AsaasSubscriptionMetrics } from '@/components/AsaasSubscriptionMetrics';
import { AsaasCouponManager } from '@/components/AsaasCouponManager';
import { APIDocumentation } from '@/components/APIDocumentation';

export default function Admin() {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
        <ScrollableRow className="pb-2">
          <TabsList className="flex gap-1 h-auto py-2 bg-muted rounded-md">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Dashboard</TabsTrigger>
            <TabsTrigger value="usuarios" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Usuários</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Analytics</TabsTrigger>
            <TabsTrigger value="auditoria" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Auditoria</TabsTrigger>
            <TabsTrigger value="dados" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Dados</TabsTrigger>
            <TabsTrigger value="webhooks" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Webhooks</TabsTrigger>
            <TabsTrigger value="suporte" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Suporte</TabsTrigger>
            <TabsTrigger value="testemunhos" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Testemunhos</TabsTrigger>
            <TabsTrigger value="parceiros" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Parceiros</TabsTrigger>
            <TabsTrigger value="marketplace" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Marketplace</TabsTrigger>
            <TabsTrigger value="sistema" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Sistema</TabsTrigger>
            <TabsTrigger value="configuracoes" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Config</TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">API</TabsTrigger>
          </TabsList>
        </ScrollableRow>

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
          <SecureAdminUserManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-6">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="dados" className="space-y-6">
          <AdminDataManager />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="space-y-6">
            <AsaasSubscriptionMetrics />
            <AsaasCouponManager />
            <AsaasWebhookMonitor />
          </div>
        </TabsContent>

        <TabsContent value="suporte" className="space-y-6">
          <SupportTicketManager />
        </TabsContent>

        <TabsContent value="testemunhos" className="space-y-6">
          <AdminTestimonialManager />
        </TabsContent>

        <TabsContent value="parceiros" className="space-y-6">
          <AdminPartnerManager />
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <PropertyTransferAdmin />
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Status
              </TabsTrigger>
              <TabsTrigger value="alertas" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs">
              <SystemLogs />
            </TabsContent>
            
            <TabsContent value="status">
              <SystemStatus />
            </TabsContent>
            
            <TabsContent value="alertas">
              <SystemAlerts />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manutenção
              </TabsTrigger>
              <TabsTrigger value="emails" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Emails
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Integrações
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Segurança
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <GeneralSettings />
            </TabsContent>
            <TabsContent value="maintenance" className="space-y-4">
              <MaintenanceSettings />
            </TabsContent>
            <TabsContent value="emails" className="space-y-4">
              <EmailTemplates />
            </TabsContent>
            <TabsContent value="integrations" className="space-y-4">
              <Integrations />
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <SecuritySettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <APIDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  );
}