import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const SimplifiedIndicationManagement = () => (
  <Card>
    <CardHeader>
      <CardTitle>Sistema de Indicações</CardTitle>
      <CardDescription>Módulo em desenvolvimento</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Funcionalidade será implementada após migração completa do schema</span>
      </div>
    </CardContent>
  </Card>
);

export const SimplifiedSecurityDashboard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Dashboard de Segurança</CardTitle>
      <CardDescription>Monitoramento em desenvolvimento</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Sistema de auditoria será implementado</span>
      </div>
    </CardContent>
  </Card>
);

export const SimplifiedSupportTicketManager = () => (
  <Card>
    <CardHeader>
      <CardTitle>Gestão de Tickets</CardTitle>
      <CardDescription>Sistema de suporte em desenvolvimento</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Portal de suporte será implementado</span>
      </div>
    </CardContent>
  </Card>
);