import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface SecuritySummary {
  total_users: number;
  active_brokers: number;
  recent_logins: number;
  last_updated: string;
}

export function SecurityDashboard() {
  const { isAdmin, loading } = useAdminAuth();
  const [securityData, setSecurityData] = useState<SecuritySummary | null>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isAdmin || loading) return;

    fetchSecurityData();
    fetchRecentAudits();
  }, [isAdmin, loading]);

  const fetchSecurityData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_security_summary');
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setSecurityData({
          total_users: (data as any).total_users || 0,
          active_brokers: (data as any).active_brokers || 0,
          recent_logins: (data as any).recent_logins || 0,
          last_updated: (data as any).last_updated || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchRecentAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setRecentAudits(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  if (loading || !isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Acesso negado. Você precisa ser administrador para acessar o painel de segurança.
        </AlertDescription>
      </Alert>
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Painel de Segurança</h1>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityData?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Perfis registrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corretores Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityData?.active_brokers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Com status ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins Recentes</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityData?.recent_logins || 0}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status RLS</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Row Level Security habilitado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Measures */}
      <Card>
        <CardHeader>
          <CardTitle>Medidas de Segurança Ativas</CardTitle>
          <CardDescription>
            Status das principais funcionalidades de segurança implementadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Row Level Security (RLS)</span>
              <Badge variant="secondary">Ativo</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Audit Logging</span>
              <Badge variant="secondary">Ativo</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>JWT Authentication</span>
              <Badge variant="secondary">Ativo</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Input Validation</span>
              <Badge variant="secondary">Ativo</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Role-based Access</span>
              <Badge variant="secondary">Ativo</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Security Headers</span>
              <Badge variant="secondary">Ativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Auditoria Recente</CardTitle>
          <CardDescription>
            Últimas atividades auditadas no sistema (máximo 10 registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAudits.length > 0 ? (
            <div className="space-y-2">
              {recentAudits.map((audit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{audit.action}</Badge>
                    <span className="text-sm">{audit.resource_type}</span>
                    {audit.user_id && (
                      <span className="text-xs text-muted-foreground">
                        User: {audit.user_id.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(audit.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum log de auditoria encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Recomendações de Segurança:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Rotacione as chaves de API mensalmente</li>
            <li>Monitore logs de auditoria regularmente</li>
            <li>Ative autenticação de dois fatores para admins</li>
            <li>Configure alertas para atividades suspeitas</li>
            <li>Mantenha backups seguros dos dados</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}