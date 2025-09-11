import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Building, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GeneralSettings() {
  const [settings, setSettings] = useState({
    siteName: 'ConectaIOS',
    siteDescription: 'Plataforma completa para corretores de imóveis',
    contactEmail: 'contato@conectaios.com.br',
    supportEmail: 'suporte@conectaios.com.br',
    maintenanceMode: false,
    registrationEnabled: true,
    maxUploadSize: '10',
    sessionTimeout: '24',
    defaultLanguage: 'pt-BR',
    timeZone: 'America/Sao_Paulo'
  });

  const handleSave = () => {
    // Aqui você faria a chamada para salvar as configurações
    toast.success("Configurações salvas com sucesso!");
  };

  const handleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Configure as informações básicas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nome do Site</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Idioma Padrão</Label>
              <Input
                id="defaultLanguage"
                value={settings.defaultLanguage}
                onChange={(e) => handleChange('defaultLanguage', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Descrição do Site</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de Contato</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Email de Suporte</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">Tamanho Máximo de Upload (MB)</Label>
              <Input
                id="maxUploadSize"
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleChange('maxUploadSize', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, apenas administradores podem acessar o site
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Registro de Novos Usuários</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que novos usuários se cadastrem na plataforma
                </p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => handleChange('registrationEnabled', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}