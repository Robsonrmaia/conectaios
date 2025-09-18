import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/layout/ResponsiveTable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageWrapper from '@/components/PageWrapper';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles?: {
    nome: string;
  } | null;
}

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          resource_type,
          resource_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesResource = !resourceFilter || log.resource_type === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-success/20 text-success';
      case 'update': return 'bg-warning/20 text-warning';
      case 'delete': return 'bg-destructive/20 text-destructive';
      case 'login': return 'bg-info/20 text-info';
      default: return 'bg-secondary/20 text-secondary-foreground';
    }
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Data,Usuário,Ação,Recurso,IP\n" +
      filteredLogs.map(log => 
        `${new Date(log.created_at).toLocaleString()},Sistema,${log.action},${log.resource_type},${log.ip_address || ''}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoria</CardTitle>
            <CardDescription>
              Histórico completo de ações realizadas na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ação ou recurso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" key="all-actions">Todas as ações</SelectItem>
                  <SelectItem value="create" key="create">Criar</SelectItem>
                  <SelectItem value="update" key="update">Atualizar</SelectItem>
                  <SelectItem value="delete" key="delete">Deletar</SelectItem>
                  <SelectItem value="login" key="login">Login</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por recurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" key="all-resources">Todos os recursos</SelectItem>
                  <SelectItem value="properties" key="properties">Imóveis</SelectItem>
                  <SelectItem value="clients" key="clients">Clientes</SelectItem>
                  <SelectItem value="deals" key="deals">Negociações</SelectItem>
                  <SelectItem value="users" key="users">Usuários</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportLogs} className="w-full sm:w-auto px-3 sm:px-4 text-sm sm:text-base">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Logs Table */}
            <div className="rounded-md border">
              <ResponsiveTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="hidden md:table-cell">Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead className="hidden sm:table-cell">Recurso</TableHead>
                    <TableHead className="hidden lg:table-cell">IP</TableHead>
                    <TableHead className="hidden sm:table-cell">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Carregando logs...
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDistanceToNow(new Date(log.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">Sistema</TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{log.resource_type}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip_address || '-'}
                        </TableCell>
                        <TableCell>
                          {log.resource_id && (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              ID: {log.resource_id.slice(0, 8)}...
                            </code>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </ResponsiveTable>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default AuditLogs;