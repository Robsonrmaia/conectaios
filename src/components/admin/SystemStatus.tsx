import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Server, Wifi, Mail, Shield, Activity } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  uptime: string;
  responseTime: string;
  icon: React.ReactNode;
}

const services: ServiceStatus[] = [
  {
    name: 'Banco de Dados',
    status: 'online',
    uptime: '99.98%',
    responseTime: '45ms',
    icon: <Database className="h-5 w-5" />
  },
  {
    name: 'Servidor Principal',
    status: 'online',
    uptime: '99.95%',
    responseTime: '120ms',
    icon: <Server className="h-5 w-5" />
  },
  {
    name: 'API Gateway',
    status: 'warning',
    uptime: '98.50%',
    responseTime: '200ms',
    icon: <Wifi className="h-5 w-5" />
  },
  {
    name: 'Serviço de Email',
    status: 'offline',
    uptime: '85.20%',
    responseTime: 'N/A',
    icon: <Mail className="h-5 w-5" />
  },
  {
    name: 'Autenticação',
    status: 'online',
    uptime: '99.99%',
    responseTime: '35ms',
    icon: <Shield className="h-5 w-5" />
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'warning':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'offline':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'warning':
      return 'Atenção';
    case 'offline':
      return 'Offline';
    default:
      return 'Desconhecido';
  }
};

export default function SystemStatus() {
  const systemHealth = 85; // Calculado baseado nos serviços
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status Geral do Sistema
          </CardTitle>
          <CardDescription>
            Saúde geral: {systemHealth}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={systemHealth} className="w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status dos Serviços</CardTitle>
          <CardDescription>
            Monitoramento em tempo real dos serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  {service.icon}
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Uptime: {service.uptime}</span>
                      <span>Resposta: {service.responseTime}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {getStatusText(service.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}