import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Users, TrendingUp, Award, Share2, DollarSign } from 'lucide-react';

export default function Indicacoes() {
  const stats = {
    totalIndicacoes: 15,
    indicacoesAtivas: 8,
    comissaoTotal: 12500,
    proximaRecompensa: 25000
  };

  const indicacoes = [
    {
      id: 1,
      nome: 'Carlos Oliveira',
      email: 'carlos@email.com',
      status: 'ativo',
      dataIndicacao: '2024-01-15',
      vendas: 3,
      comissaoGerada: 4500
    },
    {
      id: 2,
      nome: 'Ana Santos',
      email: 'ana@email.com',
      status: 'ativo',
      dataIndicacao: '2024-01-20',
      vendas: 2,
      comissaoGerada: 3200
    },
    {
      id: 3,
      nome: 'Roberto Silva',
      email: 'roberto@email.com',
      status: 'pendente',
      dataIndicacao: '2024-01-25',
      vendas: 0,
      comissaoGerada: 0
    }
  ];

  const recompensas = [
    {
      id: 1,
      titulo: 'Primeira Indicação',
      descricao: 'Ganhe R$ 500 pela sua primeira indicação ativa',
      valor: 500,
      requisito: '1 indicação ativa',
      conquistada: true
    },
    {
      id: 2,
      titulo: 'Rede de Sucesso',
      descricao: 'R$ 2.000 por ter 5 indicações ativas',
      valor: 2000,
      requisito: '5 indicações ativas',
      conquistada: true
    },
    {
      id: 3,
      titulo: 'Embaixador',
      descricao: 'R$ 5.000 por ter 10 indicações ativas',
      valor: 5000,
      requisito: '10 indicações ativas',
      conquistada: false
    },
    {
      id: 4,
      titulo: 'Líder da Rede',
      descricao: 'R$ 10.000 por gerar R$ 50.000 em comissões',
      valor: 10000,
      requisito: 'R$ 50.000 em comissões',
      conquistada: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-success/20 text-success';
      case 'pendente': return 'bg-warning/20 text-warning';
      case 'inativo': return 'bg-muted/20 text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const progressToNextReward = (stats.comissaoTotal / stats.proximaRecompensa) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Indique e Ganhe
          </h1>
            <p className="text-muted-foreground">
              Convide outros corretores e ganhe descontos nas mensalidades
            </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90 px-3 sm:px-4 py-2 text-sm sm:text-base w-full sm:w-auto">
          <Share2 className="h-4 w-4 mr-2" />
          Fazer Indicação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.totalIndicacoes}</div>
                <div className="text-sm text-muted-foreground">Total de Indicações</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{stats.indicacoesAtivas}</div>
                <div className="text-sm text-muted-foreground">Indicações Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">
            {stats.comissaoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="text-sm text-muted-foreground">Desconto Total em Mensalidades</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {Math.round(progressToNextReward)}%
            </div>
            <div className="text-sm text-muted-foreground">Próxima Recompensa</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Reward */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Progresso para Próxima Recompensa
          </CardTitle>
          <CardDescription>
            Faltam R$ {(stats.proximaRecompensa - stats.comissaoTotal).toLocaleString('pt-BR')} para sua próxima recompensa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressToNextReward} className="mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>R$ {stats.comissaoTotal.toLocaleString('pt-BR')}</span>
            <span>R$ {stats.proximaRecompensa.toLocaleString('pt-BR')}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minhas Indicações */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Indicações</CardTitle>
            <CardDescription>
              Corretores que você indicou para a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {indicacoes.map((indicacao) => (
              <div key={indicacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{indicacao.nome}</div>
                  <div className="text-sm text-muted-foreground">{indicacao.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Indicado em {new Date(indicacao.dataIndicacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={getStatusColor(indicacao.status)}>
                    {indicacao.status === 'ativo' ? 'Ativo' : 
                     indicacao.status === 'pendente' ? 'Pendente' : 'Inativo'}
                  </Badge>
                  <div className="text-sm">
                    <div>{indicacao.vendas} vendas</div>
                    <div className="text-primary font-medium">
                      {indicacao.comissaoGerada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} desconto
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recompensas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Recompensas
            </CardTitle>
            <CardDescription>
              Marcos e recompensas do programa de indicação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recompensas.map((recompensa) => (
              <div key={recompensa.id} className={`p-3 border rounded-lg ${
                recompensa.conquistada ? 'bg-success/5 border-success/20' : 'bg-muted/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{recompensa.titulo}</h4>
                      {recompensa.conquistada && (
                        <Badge className="bg-success/20 text-success">
                          Conquistada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recompensa.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requisito: {recompensa.requisito}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <DollarSign className="h-4 w-4" />
                      R$ {recompensa.valor.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona o Programa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Indique</h3>
              <p className="text-sm text-muted-foreground">
                Convide outros corretores para usar nossa plataforma
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Eles Vendem</h3>
              <p className="text-sm text-muted-foreground">
                Seus indicados usam a plataforma e fazem vendas
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Você Ganha</h3>
              <p className="text-sm text-muted-foreground">
                Receba descontos na mensalidade do seu plano
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}