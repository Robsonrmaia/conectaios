import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  FileText,
  HardDrive
} from 'lucide-react';
import { validatePurgePermission, logSecurityAction } from '@/lib/safety';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function DataManagement() {
  const [loading, setLoading] = useState(false);
  const [purgeEnabled, setPurgeEnabled] = useState(validatePurgePermission());
  const [lastPurge, setLastPurge] = useState<string | null>(null);

  const handleStoragePurge = async () => {
    if (!purgeEnabled) {
      toast({
        title: "Operação Bloqueada",
        description: "Limpeza de dados não habilitada. Configure VITE_ALLOW_SAMPLE_PURGE=true",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(
      'ATENÇÃO: Esta operação removerá TODOS os arquivos de imagem do storage. Continuar?'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      logSecurityAction('STORAGE_PURGE_INITIATED');

      const { data, error } = await supabase.functions.invoke('storage-purge', {
        body: { confirm: true }
      });

      if (error) throw error;

      toast({
        title: "Limpeza Concluída",
        description: `${data.removed} arquivos removidos do storage`,
      });

      setLastPurge(new Date().toISOString());
      logSecurityAction('STORAGE_PURGE_COMPLETED', { filesRemoved: data.removed });

    } catch (error: any) {
      console.error('Error in storage purge:', error);
      toast({
        title: "Erro na Limpeza",
        description: error.message || 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseCount = async () => {
    try {
      setLoading(true);
      
      const queries = [
        'SELECT count(*) as count FROM public.imoveis',
        'SELECT count(*) as count FROM public.crm_clients', 
        'SELECT count(*) as count FROM public.crm_deals',
        'SELECT count(*) as count FROM public.leads',
        'SELECT count(*) as count FROM public.minisites'
      ];

      // Mock count for now - in real implementation would use edge function
      toast({
        title: "Contagem de Dados",
        description: "Funcionalidade será implementada com edge function segura",
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Gestão de Dados
        </h1>
        <p className="text-muted-foreground mt-1">
          Controle de limpeza e manutenção de dados do sistema
        </p>
      </div>

      {/* Status de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status de Segurança
          </CardTitle>
          <CardDescription>
            Configurações de segurança para operações de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Limpeza de Dados de Exemplo</h4>
              <p className="text-sm text-muted-foreground">
                Permite remoção controlada de dados de demonstração
              </p>
            </div>
            <Badge variant={purgeEnabled ? 'destructive' : 'default'}>
              {purgeEnabled ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  HABILITADO
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  PROTEGIDO
                </>
              )}
            </Badge>
          </div>

          {purgeEnabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ATENÇÃO:</strong> O modo de limpeza está ativo. 
                Operações de remoção em massa estão desbloqueadas.
                Desabilite após a manutenção: VITE_ALLOW_SAMPLE_PURGE=false
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Limpeza do Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Limpeza do Storage
          </CardTitle>
          <CardDescription>
            Remove arquivos de imagem de demonstração do bucket 'imoveis'
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Arquivos de Demonstração</h4>
              <p className="text-sm text-muted-foreground">
                Remove todos os arquivos em imoveis/public/* (mantém estrutura)
              </p>
            </div>
            <Button
              onClick={handleStoragePurge}
              disabled={!purgeEnabled || loading}
              variant="destructive"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Limpar Storage
            </Button>
          </div>

          {lastPurge && (
            <div className="text-xs text-muted-foreground">
              Última limpeza: {new Date(lastPurge).toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scripts de Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scripts de Manutenção
          </CardTitle>
          <CardDescription>
            Scripts SQL para limpeza e verificação de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">001_purge_demo.sql</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Remove todos os dados funcionais mantendo estrutura
              </p>
              <code className="text-xs bg-muted p-2 rounded block">
                TRUNCATE TABLE public.messages, public.matches, public.leads...
              </code>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">check_clean.sql</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Verifica integridade pós-limpeza
              </p>
              <code className="text-xs bg-muted p-2 rounded block">
                SELECT 'imoveis', count(*) FROM public.imoveis...
              </code>
            </div>
          </div>

          <Button
            onClick={handleDatabaseCount}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Verificar Contagem de Dados
          </Button>
        </CardContent>
      </Card>

      {/* Importação de Dados Reais */}
      <Card>
        <CardHeader>
          <CardTitle>Importação de Dados Reais</CardTitle>
          <CardDescription>
            Como importar dados de produção após a limpeza
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">Feeds Automatizados</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>CNM</strong>: Edge Function `feeds-cnm`</li>
              <li>• <strong>OLX</strong>: Edge Function `feeds-olx`</li>
              <li>• <strong>VRSync</strong>: Edge Function `import-vrsync`</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Upload Manual</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Imagens</strong>: Através da interface de gestão</li>
              <li>• <strong>Storage Path</strong>: `imoveis/public/[property-id]/`</li>
              <li>• <strong>Integração</strong>: Use `src/data/index.ts` para todas as operações</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}