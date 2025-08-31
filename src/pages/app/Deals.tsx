import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle, XCircle, User, Building2, Calendar } from 'lucide-react';

export default function Deals() {
  const deals = [
    {
      id: 1,
      clientName: 'Maria Silva',
      propertyTitle: 'Apartamento Jardins',
      value: 850000,
      commission: 42500,
      status: 'negociacao',
      createdAt: '2024-01-15',
      expectedClose: '2024-02-15'
    },
    {
      id: 2,
      clientName: 'João Santos',
      propertyTitle: 'Casa Alphaville',
      value: 1200000,
      commission: 60000,
      status: 'proposta',
      createdAt: '2024-01-20',
      expectedClose: '2024-02-20'
    },
    {
      id: 3,
      clientName: 'Ana Costa',
      propertyTitle: 'Cobertura Barra',
      value: 2500000,
      commission: 125000,
      status: 'finalizado',
      createdAt: '2024-01-10',
      expectedClose: '2024-01-25'
    },
    {
      id: 4,
      clientName: 'Pedro Lima',
      propertyTitle: 'Apartamento Vila Madalena',
      value: 650000,
      commission: 32500,
      status: 'cancelado',
      createdAt: '2024-01-05',
      expectedClose: '2024-01-30'
    }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'proposta':
        return { 
          label: 'Proposta', 
          color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
          icon: FileText 
        };
      case 'negociacao':
        return { 
          label: 'Negociação', 
          color: 'bg-warning/20 text-warning',
          icon: Clock 
        };
      case 'finalizado':
        return { 
          label: 'Finalizado', 
          color: 'bg-success/20 text-success',
          icon: CheckCircle 
        };
      case 'cancelado':
        return { 
          label: 'Cancelado', 
          color: 'bg-destructive/20 text-destructive',
          icon: XCircle 
        };
      default:
        return { 
          label: 'Desconhecido', 
          color: 'bg-muted',
          icon: FileText 
        };
    }
  };

  const filterDeals = (status?: string) => {
    if (!status) return deals;
    return deals.filter(deal => deal.status === status);
  };

  const totalCommission = deals
    .filter(deal => deal.status === 'finalizado')
    .reduce((total, deal) => total + deal.commission, 0);

  const DealCard = ({ deal }: { deal: any }) => {
    const statusConfig = getStatusConfig(deal.status);
    const StatusIcon = statusConfig.icon;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{deal.propertyTitle}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                {deal.clientName}
              </CardDescription>
            </div>
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Valor do Imóvel</div>
              <div className="text-lg font-semibold">
                R$ {deal.value.toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Comissão</div>
              <div className="text-lg font-semibold text-primary">
                R$ {deal.commission.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Criado: {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
            </div>
            {deal.status !== 'finalizado' && deal.status !== 'cancelado' && (
              <div>
                Previsão: {new Date(deal.expectedClose).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Negociações
          </h1>
          <p className="text-muted-foreground">
            Acompanhe todas as suas negociações
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{deals.length}</div>
            <div className="text-sm text-muted-foreground">Total de Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {filterDeals('finalizado').length}
            </div>
            <div className="text-sm text-muted-foreground">Finalizados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {filterDeals('negociacao').length + filterDeals('proposta').length}
            </div>
            <div className="text-sm text-muted-foreground">Em Andamento</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              R$ {totalCommission.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-muted-foreground">Comissões Recebidas</div>
          </CardContent>
        </Card>
      </div>

      {/* Deals Tabs */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos ({deals.length})</TabsTrigger>
          <TabsTrigger value="proposta">Propostas ({filterDeals('proposta').length})</TabsTrigger>
          <TabsTrigger value="negociacao">Negociação ({filterDeals('negociacao').length})</TabsTrigger>
          <TabsTrigger value="finalizado">Finalizados ({filterDeals('finalizado').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deals.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="proposta" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterDeals('proposta').map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="negociacao" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterDeals('negociacao').map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="finalizado" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterDeals('finalizado').map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}