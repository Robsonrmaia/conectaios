import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Clock, CheckCircle, XCircle, User, Building2, Calendar, Home, Printer, Plus, Percent, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ContractGenerator } from '@/components/ContractGenerator';
import { useDeals } from '@/hooks/useDeals';
import { CreateDealDialog } from '@/components/CreateDealDialog';

export default function Deals() {
  const navigate = useNavigate();
  const { deals, loading, updateDeal } = useDeals();
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'proposal':
      case 'proposta':
        return { 
          label: 'Proposta', 
          color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
          icon: FileText 
        };
      case 'negotiating':
      case 'negociacao':
        return { 
          label: 'Negociação', 
          color: 'bg-warning/20 text-warning',
          icon: Clock 
        };
      case 'closed':
      case 'finalizado':
        return { 
          label: 'Finalizado', 
          color: 'bg-success/20 text-success',
          icon: CheckCircle 
        };
      case 'cancelled':
      case 'cancelado':
        return { 
          label: 'Cancelado', 
          color: 'bg-destructive/20 text-destructive',
          icon: XCircle 
        };
      default:
        return { 
          label: status || 'Desconhecido', 
          color: 'bg-muted',
          icon: FileText 
        };
    }
  };

  const filterDeals = (status?: string) => {
    if (!status) return deals;
    const statusMap: Record<string, string[]> = {
      'proposal': ['proposal', 'proposta'],
      'negotiating': ['negotiating', 'negociacao'],
      'closed': ['closed', 'finalizado'],
      'cancelled': ['cancelled', 'cancelado']
    };
    
    return deals.filter(deal => 
      statusMap[status]?.includes(deal.status) || deal.status === status
    );
  };

  const totalCommission = deals
    .filter(deal => ['closed', 'finalizado'].includes(deal.status))
    .reduce((total, deal) => total + (deal.commission_amount || 0), 0);

  const handlePrintContract = (deal: any) => {
    setSelectedDeal(deal);
    setIsContractDialogOpen(true);
  };

  const DealCard = ({ deal }: { deal: any }) => {
    const statusConfig = getStatusConfig(deal.status);
    const StatusIcon = statusConfig.icon;
    const propertyTitle = deal.property?.title || 'Sem propriedade';
    const clientName = deal.client?.nome || 'Sem cliente';
    const value = deal.property?.price || deal.offer_amount || 0;
    const commission = deal.commission_amount || 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{propertyTitle}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                {clientName}
              </CardDescription>
              {deal.partners && deal.partners.length > 0 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {deal.partners.length} parceiro(s)
                </div>
              )}
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
              <div className="text-sm text-muted-foreground">Valor Ofertado</div>
              <div className="text-lg font-semibold">
                {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Comissão</div>
              <div className="text-lg font-semibold text-primary">
                {commission > 0 ? commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'A definir'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Criado: {new Date(deal.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>

          {deal.notes && (
            <div className="text-xs text-muted-foreground border-l-2 pl-2">
              {deal.notes}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex-row-wrap pt-2">
            {(['closed', 'finalizado', 'negotiating', 'negociacao'].includes(deal.status)) && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handlePrintContract(deal)}
                className="btn-fluid"
              >
                <Printer className="h-3 w-3 mr-1" />
                Contrato
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container-responsive flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando negociações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive w-full overflow-x-hidden space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 w-fit"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Negociações
            </h1>
            <p className="text-muted-foreground">
              Acompanhe todas as suas negociações
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDealOpen(true)} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Nova Negociação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{deals.length}</div>
            <div className="text-sm text-muted-foreground">Total de Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {filterDeals('closed').length}
            </div>
            <div className="text-sm text-muted-foreground">Finalizados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">
              {filterDeals('negotiating').length + filterDeals('proposal').length}
            </div>
            <div className="text-sm text-muted-foreground">Em Andamento</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xl sm:text-2xl font-bold text-primary break-words">
              {totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-sm text-muted-foreground">Comissões Recebidas</div>
          </CardContent>
        </Card>
      </div>

      {/* Deals Tabs */}
      <Tabs defaultValue="todos" className="space-y-4">
        <div className="-mx-4 px-4 overflow-x-auto">
          <TabsList className="min-w-max">
            <TabsTrigger value="todos">Todos ({deals.length})</TabsTrigger>
            <TabsTrigger value="proposal">Propostas ({filterDeals('proposal').length})</TabsTrigger>
            <TabsTrigger value="negotiating">Negociação ({filterDeals('negotiating').length})</TabsTrigger>
            <TabsTrigger value="closed">Finalizados ({filterDeals('closed').length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="todos" className="space-y-4">
          {deals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhuma negociação encontrada</p>
                <Button onClick={() => setIsCreateDealOpen(true)} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Nova Negociação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {deals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="proposal" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filterDeals('proposal').length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma proposta</CardContent></Card>
            ) : (
              filterDeals('proposal').map(deal => <DealCard key={deal.id} deal={deal} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="negotiating" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filterDeals('negotiating').length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma negociação em andamento</CardContent></Card>
            ) : (
              filterDeals('negotiating').map(deal => <DealCard key={deal.id} deal={deal} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filterDeals('closed').length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma negociação finalizada</CardContent></Card>
            ) : (
              filterDeals('closed').map(deal => <DealCard key={deal.id} deal={deal} />)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Deal Dialog */}
      {isCreateDealOpen && (
        <CreateDealDialog 
          open={isCreateDealOpen}
          onOpenChange={setIsCreateDealOpen}
        />
      )}

      {/* Contract Generator Dialog */}
      <ContractGenerator 
        deal={selectedDeal}
        isOpen={isContractDialogOpen}
        onClose={() => setIsContractDialogOpen(false)}
      />
    </div>
  );
}