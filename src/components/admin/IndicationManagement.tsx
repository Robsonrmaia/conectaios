import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Calendar,
  Eye,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Indication {
  id: string;
  id_indicador: string;
  id_indicado: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  mes_recompensa: number;
  data_criacao: string;
  data_confirmacao?: string;
  codigo_indicacao: string;
  desconto_aplicado: number;
  indicador?: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  indicado?: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
}

interface IndicationMetrics {
  total_indicacoes: number;
  indicacoes_confirmadas: number;
  taxa_conversao: number;
  receita_impactada: number;
  desconto_total_aplicado: number;
}

export function IndicationManagement() {
  const [indications, setIndications] = useState<CompatIndication[]>([]);
  const [filteredIndications, setFilteredIndications] = useState<Indication[]>([]);
  const [metrics, setMetrics] = useState<IndicationMetrics>({
    total_indicacoes: 0,
    indicacoes_confirmadas: 0,
    taxa_conversao: 0,
    receita_impactada: 0,
    desconto_total_aplicado: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchIndications = async () => {
    setLoading(true);
    try {
      // Buscar todas as indicações (admin pode ver tudo)
      const { data: indicationsData, error: indicationsError } = await supabase
        .from('indications')
        .select('*')
        .order('created_at', { ascending: false });

      if (indicationsError) throw indicationsError;

      // Para cada indicação, buscar os dados do indicador e indicado separadamente
      const indicationsWithDetails = await Promise.all(
        (indicationsData || []).map(async (indication) => {
          const [indicadorResult, indicadoResult] = await Promise.all([
            supabase
              .from('brokers')
              .select('id, name, email')
              .eq('user_id', indication.referrer_id)
              .single(),
            supabase
              .from('brokers')
              .select('id, name, email')
              .eq('user_id', indication.referred_id)
              .single()
          ]);

          return {
            ...indication,
            indicador: indicadorResult.data || null,
            indicado: indicadoResult.data || null
          };
        })
      );

      // Buscar métricas gerais
      const totalIndicacoes = indicationsWithDetails?.length || 0;
      const indicacoesConfirmadas = indicationsWithDetails?.filter(i => i.status === 'confirmado').length || 0;
      const taxaConversao = totalIndicacoes > 0 ? (indicacoesConfirmadas / totalIndicacoes) * 100 : 0;

      // Buscar descontos aplicados
      const { data: discountsData } = await supabase
        .from('indication_discounts')
        .select('discount_percentage');

      const descontoTotalAplicado = discountsData?.reduce((sum, d) => sum + (d.discount_percentage || 0), 0) || 0;
      const receitaImpactada = descontoTotalAplicado * 100; // Estimativa

      setIndications(indicationsWithDetails?.map(compatIndication) || []);
      setMetrics({
        total_indicacoes: totalIndicacoes,
        indicacoes_confirmadas: indicacoesConfirmadas,
        taxa_conversao: taxaConversao,
        receita_impactada: receitaImpactada,
        desconto_total_aplicado: descontoTotalAplicado
      });

    } catch (error: any) {
      console.error('Error fetching indications:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as indicações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const changeIndicationStatus = async (indicationId: string, newStatus: 'confirmado' | 'cancelado') => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'confirmado') {
        updateData.data_confirmacao = new Date().toISOString();
      }

      const { error } = await supabase
        .from('indications')
        .update(updateData)
        .eq('id', indicationId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Indicação ${newStatus === 'confirmado' ? 'confirmada' : 'cancelada'} com sucesso!`
      });

      await fetchIndications();
    } catch (error: any) {
      console.error('Error updating indication status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da indicação',
        variant: 'destructive'
      });
    }
  };

  const processMonthlyRewards = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('indication-system', {
        body: {
          action: 'process_rewards'
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Recompensas mensais processadas com sucesso!'
      });

      await fetchIndications();
    } catch (error: any) {
      console.error('Error processing rewards:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar recompensas mensais',
        variant: 'destructive'
      });
    }
  };

  // Filtrar indicações
  useEffect(() => {
    let filtered = indications;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(indication =>
        indication.indicador?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indication.indicado?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indication.indicador?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indication.indicado?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indication.codigo_indicacao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(indication => indication.status === statusFilter);
    }

    setFilteredIndications(filtered);
  }, [indications, searchTerm, statusFilter]);

  useEffect(() => {
    fetchIndications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-success text-success-foreground';
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'cancelado':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Indicações</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todas as indicações do sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchIndications} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={processMonthlyRewards}>
            <Calendar className="h-4 w-4 mr-2" />
            Processar Recompensas
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_indicacoes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metrics.indicacoes_confirmadas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taxa_conversao.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Impactada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.receita_impactada.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos Aplicados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -R$ {metrics.desconto_total_aplicado.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Pesquisar</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Nome, email ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="all">Todos</option>
                <option value="pendente">Pendentes</option>
                <option value="confirmado">Confirmadas</option>
                <option value="cancelado">Canceladas</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Indicações */}
      <Card>
        <CardHeader>
          <CardTitle>Indicações ({filteredIndications.length})</CardTitle>
          <CardDescription>
            Gerencie o status das indicações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIndications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {indications.length === 0 ? 'Nenhuma indicação encontrada' : 'Nenhuma indicação corresponde aos filtros'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIndications.map((indication) => (
                <div key={indication.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">INDICADOR</p>
                        <p className="font-semibold">{indication.indicador?.name}</p>
                        <p className="text-sm text-muted-foreground">{indication.indicador?.email}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">INDICADO</p>
                        <p className="font-semibold">{indication.indicado?.name}</p>
                        <p className="text-sm text-muted-foreground">{indication.indicado?.email}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(indication.status)}>
                        {indication.status}
                      </Badge>
                      
                      {indication.status === 'pendente' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => changeIndicationStatus(indication.id, 'confirmado')}
                            className="bg-success hover:bg-success/80"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => changeIndicationStatus(indication.id, 'cancelado')}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t">
                    <div>
                      <p className="text-muted-foreground">Código</p>
                      <p className="font-mono font-medium">{indication.codigo_indicacao}</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Data da Indicação</p>
                      <p className="font-medium">
                        {format(new Date(indication.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    
                    {indication.data_confirmacao && (
                      <div>
                        <p className="text-muted-foreground">Data da Confirmação</p>
                        <p className="font-medium">
                          {format(new Date(indication.data_confirmacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-muted-foreground">Mês da Recompensa</p>
                      <p className="font-medium">
                        {String(indication.mes_recompensa).slice(4, 6)}/{String(indication.mes_recompensa).slice(0, 4)}
                      </p>
                    </div>
                  </div>

                  {indication.desconto_aplicado > 0 && (
                    <div className="mt-2 p-2 bg-success/10 rounded">
                      <p className="text-sm font-medium text-success">
                        Desconto aplicado: R$ {indication.desconto_aplicado.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}