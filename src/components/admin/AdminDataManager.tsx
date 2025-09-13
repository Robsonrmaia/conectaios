import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Download, 
  Upload, 
  FileText, 
  HardDrive,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import XMLImportExport from '@/components/XMLImportExport';

export default function AdminDataManager() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simular backup - em produção faria chamada para edge function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Backup realizado",
        description: "Backup completo do sistema criado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Falha ao criar backup do sistema.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSystemRestore = async () => {
    setIsRestoring(true);
    try {
      // Simular restore - em produção faria chamada para edge function
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Sistema restaurado",
        description: "Dados do sistema restaurados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na restauração",
        description: "Falha ao restaurar dados do sistema.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const exportUsers = async () => {
    try {
      // Simular exportação de usuários
      const csv = `ID,Nome,Email,Data Cadastro,Status
1,João Silva,joao@email.com,2024-01-15,ativo
2,Maria Santos,maria@email.com,2024-01-16,ativo`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'usuarios.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: "Lista de usuários exportada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar dados dos usuários.",
        variant: "destructive",
      });
    }
  };

  const exportProperties = async () => {
    try {
      // Simular exportação de imóveis
      const csv = `ID,Título,Tipo,Valor,Cidade,Status
1,Apartamento Centro,apartamento,450000,São Paulo,disponivel
2,Casa Jardins,casa,850000,São Paulo,vendido`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'imoveis.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: "Lista de imóveis exportada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar dados dos imóveis.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestão de Dados</h2>
        <p className="text-muted-foreground">
          Ferramentas para backup, restauração e exportação de dados do sistema
        </p>
      </div>

      <Tabs defaultValue="backup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Backup & Restore
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Dados
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar XML
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup Completo
                </CardTitle>
                <CardDescription>
                  Cria uma cópia de segurança completa de todos os dados do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    O backup pode demorar alguns minutos dependendo do volume de dados.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleBackup} 
                  disabled={isBackingUp}
                  className="w-full"
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Criando Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Criar Backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Restaurar Sistema
                </CardTitle>
                <CardDescription>
                  Restaura o sistema a partir de um backup anterior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>ATENÇÃO:</strong> Esta ação irá sobrescrever todos os dados atuais.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleSystemRestore} 
                  disabled={isRestoring}
                  variant="destructive"
                  className="w-full"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Restaurar Sistema
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Backups</CardTitle>
              <CardDescription>Últimos backups realizados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: '2024-01-31 02:00', size: '1.2 GB', status: 'Sucesso' },
                  { date: '2024-01-30 02:00', size: '1.1 GB', status: 'Sucesso' },
                  { date: '2024-01-29 02:00', size: '1.1 GB', status: 'Sucesso' },
                ].map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{backup.date}</div>
                      <div className="text-sm text-muted-foreground">Tamanho: {backup.size}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-success">{backup.status}</span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Exportar Usuários
                </CardTitle>
                <CardDescription>
                  Exporta lista completa de usuários em formato CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportUsers} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Usuários CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Exportar Imóveis
                </CardTitle>
                <CardDescription>
                  Exporta lista completa de imóveis em formato CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportProperties} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Imóveis CSV
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios Personalizados</CardTitle>
              <CardDescription>
                Gere relatórios customizados com filtros específicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Vendas
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Leads
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Comissões
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Imóveis XML
              </CardTitle>
              <CardDescription>
                Importe imóveis em massa usando arquivos XML padrão do mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <XMLImportExport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}