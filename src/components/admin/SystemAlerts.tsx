import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, X, CheckCircle } from "lucide-react";
import { useState } from "react";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  resolved: boolean;
}

const initialAlerts: Alert[] = [
  {
    id: '1',
    title: 'Alto uso de CPU',
    description: 'CPU está operando em 95% de capacidade há mais de 10 minutos.',
    severity: 'critical',
    timestamp: '2024-01-15 14:30:00',
    resolved: false
  },
  {
    id: '2',
    title: 'Falha no serviço de email',
    description: 'Serviço de envio de emails está offline há 25 minutos.',
    severity: 'critical',
    timestamp: '2024-01-15 14:15:00',
    resolved: false
  },
  {
    id: '3',
    title: 'Lentidão na API Gateway',
    description: 'Tempo de resposta da API acima de 500ms.',
    severity: 'warning',
    timestamp: '2024-01-15 14:10:00',
    resolved: false
  },
  {
    id: '4',
    title: 'Backup concluído',
    description: 'Backup diário executado com sucesso.',
    severity: 'info',
    timestamp: '2024-01-15 13:00:00',
    resolved: true
  }
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/10 text-red-700 border-red-200';
    case 'warning':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'info':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
};

export default function SystemAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Ativos ({activeAlerts.length})
          </CardTitle>
          <CardDescription>
            Alertas que requerem atenção imediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Nenhum alerta ativo no momento!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Alertas Resolvidos ({resolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{alert.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {alert.timestamp}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}