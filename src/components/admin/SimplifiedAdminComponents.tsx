import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
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
        <div className="border-b">
          <div className="flex space-x-4 overflow-x-auto">
            <Tabs.TabsTrigger value="suporte" className="px-4 py-2">Suporte</Tabs.TabsTrigger>
            <Tabs.TabsTrigger value="testemunhos" className="px-4 py-2">Testemunhos</Tabs.TabsTrigger>
            <Tabs.TabsTrigger value="parceiros" className="px-4 py-2">Parceiros</Tabs.TabsTrigger>
          </div>
        </div>

        <Tabs.TabsContent value="suporte">
          <AdminSupportManager />
        </Tabs.TabsContent>
        
        <Tabs.TabsContent value="testemunhos">
          <AdminTestimonialsManager />
        </Tabs.TabsContent>
        
        <Tabs.TabsContent value="parceiros">
          <AdminPartnersManager />
        </Tabs.TabsContent>
      </Tabs>
    </div>
  );
}

export const SimplifiedSupportTicketManager = AdminSupportManager;
export const SimplifiedTestimonialManager = AdminTestimonialsManager;
export const SimplifiedPartnerManager = AdminPartnersManager;