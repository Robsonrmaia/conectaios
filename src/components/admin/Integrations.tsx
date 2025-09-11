import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, TestTube, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config: Record<string, string>;
}

const initialIntegrations: Integration[] = [
  {
    id: 'asaas',
    name: 'Asaas Pagamentos',
    description: 'Gateway de pagamento para planos premium',
    enabled: true,
    status: 'connected',
    lastSync: '2024-01-15 14:30:00',
    config: {
      apiKey: '••••••••••••••••',
      environment: 'production'
    }
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'API para processamento de IA e ML',
    enabled: true,
    status: 'connected',
    lastSync: '2024-01-15 14:25:00',
    config: {
      apiKey: '••••••••••••••••'
    }
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Síntese de voz para áudio descriptions',
    enabled: true,
    status: 'connected',
    lastSync: '2024-01-15 14:20:00',
    config: {
      apiKey: '••••••••••••••••'
    }
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'API para chat e processamento de texto',
    enabled: false,
    status: 'disconnected',
    config: {
      apiKey: '',
      model: 'gpt-3.5-turbo'
    }
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Serviço de envio de emails transacionais',
    enabled: true,
    status: 'error',
    lastSync: '2024-01-15 13:45:00',
    config: {
      apiKey: '••••••••••••••••',
      domain: 'conectaios.com.br'
    }
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'error':
      return 'bg-red-500/10 text-red-700 border-red-200';
    case 'disconnected':
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'connected':
      return 'Conectado';
    case 'error':
      return 'Erro';
    case 'disconnected':
      return 'Desconectado';
    default:
      return 'Desconhecido';
  }
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const handleSave = () => {
    if (!selectedIntegration) return;
    
    setIntegrations(integrations.map(i => 
      i.id === selectedIntegration.id ? selectedIntegration : i
    ));
    toast.success("Configurações da integração salvas!");
    setSelectedIntegration(null);
  };

  const handleTest = (integration: Integration) => {
    toast.info(`Testando conexão com ${integration.name}...`);
    // Simular teste de conexão
    setTimeout(() => {
      toast.success(`Conexão com ${integration.name} testada com sucesso!`);
    }, 2000);
  };

  const handleSync = (integration: Integration) => {
    toast.info(`Sincronizando ${integration.name}...`);
    // Simular sincronização
    setTimeout(() => {
      const updatedIntegrations = integrations.map(i => 
        i.id === integration.id 
          ? { ...i, lastSync: new Date().toLocaleString('pt-BR') }
          : i
      );
      setIntegrations(updatedIntegrations);
      toast.success(`${integration.name} sincronizado!`);
    }, 2000);
  };

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(integrations.map(i => 
      i.id === integrationId ? { ...i, enabled: !i.enabled } : i
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integrações de Terceiros
          </CardTitle>
          <CardDescription>
            Configure e monitore integrações com serviços externos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => toggleIntegration(integration.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{integration.name}</h4>
                        <Badge className={getStatusColor(integration.status)}>
                          {getStatusText(integration.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Última sincronização: {integration.lastSync}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(integration)}
                      disabled={!integration.enabled}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Testar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(integration)}
                      disabled={!integration.enabled}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Config
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar {selectedIntegration.name}</CardTitle>
            <CardDescription>
              Configure os parâmetros da integração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(selectedIntegration.config).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {key === 'apiKey' ? 'Chave da API' : 
                   key === 'environment' ? 'Ambiente' :
                   key === 'model' ? 'Modelo' :
                   key === 'domain' ? 'Domínio' : key}
                </Label>
                <Input
                  id={key}
                  type={key === 'apiKey' ? 'password' : 'text'}
                  value={value}
                  onChange={(e) => setSelectedIntegration({
                    ...selectedIntegration,
                    config: {
                      ...selectedIntegration.config,
                      [key]: e.target.value
                    }
                  })}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedIntegration(null)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}