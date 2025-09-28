import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RUNTIME, healthCheck } from '@/config/runtime';

interface HealthStatus {
  status: number;
  projectRef: string;
  isSupabaseUrl: boolean;
  connected: boolean;
  error?: string;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await healthCheck();
      setHealth(result);
    } catch (error) {
      setHealth({
        status: 0,
        projectRef: RUNTIME.projectId,
        isSupabaseUrl: RUNTIME.url.endsWith('.supabase.co'),
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusColor = () => {
    if (!health) return 'secondary';
    if (health.connected) return 'default';
    return 'destructive';
  };

  const getStatusText = () => {
    if (!health) return 'Verificando...';
    if (health.connected) return 'Conectado';
    return 'Erro de Conexão';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏥 Status da Conexão Supabase
            <Badge variant={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Project ID:</p>
              <p className="text-sm text-muted-foreground">{RUNTIME.projectId}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">URL:</p>
              <p className="text-sm text-muted-foreground break-all">{RUNTIME.url}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">URL Válida:</p>
              <Badge variant={health?.isSupabaseUrl ? 'default' : 'destructive'}>
                {health?.isSupabaseUrl ? '✓ Supabase URL' : '✗ URL Inválida'}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium">Status HTTP:</p>
              <p className="text-sm text-muted-foreground">
                {health?.status || 'N/A'} 
                {health?.status === 403 && ' (RLS - Normal)'}
              </p>
            </div>
          </div>

          {health?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800">Erro:</p>
              <p className="text-sm text-red-600">{health.error}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Diagnóstico:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Variáveis de ambiente carregadas</li>
              <li>✓ Runtime configurado corretamente</li>
              <li>{health?.isSupabaseUrl ? '✓' : '✗'} URL do Supabase válida</li>
              <li>{health?.connected ? '✓' : '✗'} Conexão com API</li>
            </ul>
          </div>

          <Button 
            onClick={runHealthCheck} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Verificando...' : 'Executar Verificação Novamente'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug de Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm"><strong>Environment:</strong> {import.meta.env.MODE}</p>
            <p className="text-sm"><strong>DEV Mode:</strong> {import.meta.env.DEV ? 'Sim' : 'Não'}</p>
            <p className="text-sm"><strong>Allow Local Config:</strong> {import.meta.env.VITE_ALLOW_LOCAL_CONFIG || 'Não definido'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}