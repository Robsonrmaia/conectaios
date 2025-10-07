import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Handshake, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useBrokerPartnerships } from '@/hooks/useBrokerPartnerships';

export default function Partnerships() {
  const { partnerships, loading } = useBrokerPartnerships();

  const pending = partnerships.filter(p => p.status === 'pending');
  const active = partnerships.filter(p => p.status === 'active');
  const history = partnerships.filter(p => ['rejected', 'expired', 'cancelled'].includes(p.status));

  if (loading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Parcerias entre Corretores</h1>
        <p className="text-muted-foreground">Gerencie suas parcerias e divisões de comissão</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Handshake className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerships.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Ativas ({active.length})</TabsTrigger>
          <TabsTrigger value="history">Histórico ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pending.map(partnership => (
            <Card key={partnership.id}>
              <CardHeader>
                <CardTitle>{partnership.property?.title}</CardTitle>
                <CardDescription>
                  Status: Aguardando resposta • Expira em: {new Date(partnership.expires_at!).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Divisão proposta: {JSON.stringify(partnership.commission_split)}
                </div>
              </CardContent>
            </Card>
          ))}
          {pending.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma parceria pendente
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {active.map(partnership => (
            <Card key={partnership.id}>
              <CardHeader>
                <CardTitle>{partnership.property?.title}</CardTitle>
                <CardDescription>
                  Status: ✅ Ativa e assinada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Divisão: {JSON.stringify(partnership.commission_split)}
                </div>
              </CardContent>
            </Card>
          ))}
          {active.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma parceria ativa
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.map(partnership => (
            <Card key={partnership.id}>
              <CardHeader>
                <CardTitle>{partnership.property?.title}</CardTitle>
                <CardDescription>
                  Status: {partnership.status}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
          {history.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum histórico
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
