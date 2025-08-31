import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Clock, CheckCircle, XCircle, User, Building2, Calendar, Home, Printer, Plus, Percent } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Deals() {
  const navigate = useNavigate();
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [proposalData, setProposalData] = useState({
    offerAmount: '',
    commissionPercent: '5',
    notes: '',
    expiryDays: '15'
  });

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

  const handlePrintContract = (deal: any) => {
    toast({
      title: "Imprimindo Contrato",
      description: `Gerando contrato para ${deal.propertyTitle}`,
    });
    // Aqui você implementaria a lógica para gerar e imprimir o contrato
  };

  const handleCreateProposal = (deal: any) => {
    setSelectedDeal(deal);
    setIsProposalDialogOpen(true);
  };

  const handleSubmitProposal = () => {
    toast({
      title: "Proposta Enviada",
      description: `Proposta de R$ ${parseFloat(proposalData.offerAmount).toLocaleString('pt-BR')} enviada com sucesso!`,
    });
    
    setIsProposalDialogOpen(false);
    setProposalData({
      offerAmount: '',
      commissionPercent: '5',
      notes: '',
      expiryDays: '15'
    });
  };

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
              {deal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Comissão</div>
            <div className="text-lg font-semibold text-primary">
              {deal.commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleCreateProposal(deal)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Proposta
            </Button>
            {(deal.status === 'finalizado' || deal.status === 'negociacao') && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handlePrintContract(deal)}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Negociações
            </h1>
            <p className="text-muted-foreground">
              Acompanhe todas as suas negociações
            </p>
          </div>
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
              {deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

      {/* Proposal Dialog */}
      <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Proposta</DialogTitle>
            <DialogDescription>
              Criar proposta para {selectedDeal?.propertyTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="offerAmount">Valor da Proposta (R$)</Label>
              <Input
                id="offerAmount"
                value={proposalData.offerAmount}
                onChange={(e) => setProposalData({...proposalData, offerAmount: e.target.value})}
                placeholder="650.000,00"
              />
            </div>
            
            <div>
              <Label htmlFor="commissionSplit">Divisão da Comissão</Label>
              <Select 
                value={proposalData.commissionPercent} 
                onValueChange={(value) => setProposalData({...proposalData, commissionPercent: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50/50">50% / 50%</SelectItem>
                  <SelectItem value="60/40">60% / 40%</SelectItem>
                  <SelectItem value="70/30">70% / 30%</SelectItem>
                  <SelectItem value="80/20">80% / 20%</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiryDays">Validade (dias)</Label>
              <Select 
                value={proposalData.expiryDays} 
                onValueChange={(value) => setProposalData({...proposalData, expiryDays: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={proposalData.notes}
                onChange={(e) => setProposalData({...proposalData, notes: e.target.value})}
                placeholder="Observações adicionais sobre a proposta..."
                rows={3}
              />
            </div>

            {proposalData.offerAmount && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="text-sm text-muted-foreground">Rateio de Comissão:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Corretor Comprador ({proposalData.commissionPercent}%):</span>
                      <span className="font-semibold">
                        {(parseFloat(proposalData.offerAmount) * parseFloat(proposalData.commissionPercent) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Corretor Vendedor ({proposalData.commissionPercent}%):</span>
                      <span className="font-semibold">
                        {(parseFloat(proposalData.offerAmount) * parseFloat(proposalData.commissionPercent) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="border-t pt-1 flex justify-between text-sm font-bold">
                      <span>Total da Comissão:</span>
                      <span className="text-primary">
                        {(parseFloat(proposalData.offerAmount) * parseFloat(proposalData.commissionPercent) * 2 / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsProposalDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitProposal}
                className="flex-1"
                disabled={!proposalData.offerAmount}
              >
                <Percent className="h-4 w-4 mr-2" />
                Enviar Proposta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}