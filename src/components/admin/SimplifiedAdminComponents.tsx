import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import AdminSupportManager from '@/components/AdminSupportManager';
import AdminTestimonialsManager from '@/components/AdminTestimonialsManager';
import AdminPartnersManager from '@/components/AdminPartnersManager';

export function SimplifiedAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie o sistema e configurações</p>
      </div>

      <Tabs defaultValue="suporte" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suporte">Suporte</TabsTrigger>
          <TabsTrigger value="testemunhos">Testemunhos</TabsTrigger>
          <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
        </TabsList>

        <TabsContent value="suporte">
          <AdminSupportManager />
        </TabsContent>
        
        <TabsContent value="testemunhos">
          <AdminTestimonialsManager />
        </TabsContent>
        
        <TabsContent value="parceiros">
          <AdminPartnersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

export const SimplifiedSupportTicketManager = AdminSupportManager;
export const SimplifiedTestimonialManager = AdminTestimonialsManager;
export const SimplifiedPartnerManager = AdminPartnersManager;