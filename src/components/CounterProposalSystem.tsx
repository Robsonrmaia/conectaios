import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  MessageSquare,
  FileText,
  Check,
  X,
  Clock,
  AlertCircle,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatCurrency, parseValueInput } from '@/lib/utils';
import { useProposals } from '@/hooks/useProposals';

// Using types from useProposals hook

interface CounterProposalSystemProps {
  propertyId?: string;
  propertyTitle?: string;
  propertyValue?: number;
  onProposalSubmit?: () => void;
}

export function CounterProposalSystem({
  propertyId,
  propertyTitle,
  propertyValue,
  onProposalSubmit
}: CounterProposalSystemProps) {
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isCounterDialogOpen, setIsCounterDialogOpen] = useState(false);

  const [counterForm, setCounterForm] = useState({
    offer_amount: '',
    conditions: '',
    message: '',
    expires_in_days: '7'
  });

  const { proposals, loading, createCounterProposal: submitCounter } = useProposals(propertyId);


  const submitCounterProposal = async () => {
    if (!selectedProposal || !counterForm.offer_amount) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(counterForm.expires_in_days));

    await submitCounter(selectedProposal.id, {
      offer_amount: parseFloat(counterForm.offer_amount),
      conditions: counterForm.conditions || undefined,
      message: counterForm.message || undefined,
      expires_at: expiresAt.toISOString()
    });

    setIsCounterDialogOpen(false);
    setCounterForm({
      offer_amount: '',
      conditions: '',
      message: '',
      expires_in_days: '7'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500">Ativa</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Aceita</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirada</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getLastCounterOffer = (proposal: any) => {
    if (!proposal.counter_proposals || proposal.counter_proposals.length === 0) return proposal.offer_amount;
    return proposal.counter_proposals[proposal.counter_proposals.length - 1].offer_amount;
  };

  if (loading && proposals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Proposals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {propertyId ? 'Propostas Recebidas' : 'Todas as Propostas'}
            <Badge variant="secondary">{proposals.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma proposta encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const lastOffer = getLastCounterOffer(proposal);
                const expired = isExpired(proposal.expires_at);
                
                return (
                  <Card key={proposal.id} className={`${expired ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{proposal.property?.title || 'Imóvel'}</h3>
                          <p className="text-sm text-muted-foreground">
                            Proposta de {proposal.buyer_name}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(expired ? 'expired' : proposal.status)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label className="text-xs">Valor Original</Label>
                          <p className="font-semibold">{formatCurrency(proposal.property?.price || 0)}</p>
                        </div>
                        <div>
                          <Label className="text-xs">Proposta Inicial</Label>
                          <p className="font-semibold text-blue-600">{formatCurrency(proposal.offer_amount)}</p>
                        </div>
                        <div>
                          <Label className="text-xs">Última Oferta</Label>
                          <p className="font-semibold text-green-600">{formatCurrency(lastOffer)}</p>
                        </div>
                        <div>
                          <Label className="text-xs">Diferença</Label>
                          <div className="flex items-center gap-1">
                            {lastOffer > proposal.offer_amount ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : lastOffer < proposal.offer_amount ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : null}
                            <span className={`text-sm ${
                              lastOffer > proposal.offer_amount ? 'text-green-600' : 
                              lastOffer < proposal.offer_amount ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {formatCurrency(Math.abs(lastOffer - proposal.offer_amount))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <Label className="text-xs">Condições</Label>
                          <p className="text-sm">{proposal.conditions}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>📧 {proposal.buyer_email}</span>
                          <span>📱 {proposal.buyer_phone}</span>
                          <span>💰 {proposal.financing_type}</span>
                          {proposal.down_payment && (
                            <span>💵 Entrada: {formatCurrency(proposal.down_payment)}</span>
                          )}
                        </div>
                      </div>

                      {/* Counter Proposals */}
                      {proposal.counter_proposals.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Contra-propostas ({proposal.counter_proposals.length})
                          </h4>
                          <ScrollArea className="max-h-48">
                            <div className="space-y-3">
                              {proposal.counter_proposals.map((counter) => (
                                <div key={counter.id} className="p-3 bg-muted rounded-lg">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">Contraproposta</span>
                                    <div className="text-right">
                                      <p className="font-semibold text-primary">{formatCurrency(counter.offer_amount)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(counter.created_at), { addSuffix: true, locale: ptBR })}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm mb-2">{counter.message}</p>
                                  {counter.conditions && (
                                    <p className="text-xs text-muted-foreground">
                                      Condições: {counter.conditions}
                                    </p>
                                  )}
                                  {isExpired(counter.expires_at) && (
                                    <Alert className="mt-2">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>
                                        Esta contra-proposta expirou
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      <Separator className="my-4" />

                      <div className="flex gap-2">
                        <Dialog open={isCounterDialogOpen && selectedProposal?.id === proposal.id} onOpenChange={(open) => {
                          setIsCounterDialogOpen(open);
                          if (open) setSelectedProposal(proposal);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={expired}>
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Contra-proposta
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Nova Contra-proposta</DialogTitle>
                              <DialogDescription>
                                Envie uma contra-proposta para {proposal.buyer_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="counter_amount">Novo Valor da Proposta *</Label>
                                <Input
                                  id="counter_amount"
                                  value={counterForm.offer_amount}
                                  onChange={(e) => setCounterForm({...counterForm, offer_amount: e.target.value})}
                                  placeholder="630.000,00"
                                />
                              </div>
                              <div>
                                <Label htmlFor="counter_conditions">Condições</Label>
                                <Textarea
                                  id="counter_conditions"
                                  value={counterForm.conditions}
                                  onChange={(e) => setCounterForm({...counterForm, conditions: e.target.value})}
                                  placeholder="Condições da contra-proposta..."
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Label htmlFor="counter_message">Mensagem *</Label>
                                <Textarea
                                  id="counter_message"
                                  value={counterForm.message}
                                  onChange={(e) => setCounterForm({...counterForm, message: e.target.value})}
                                  placeholder="Sua mensagem para o interessado..."
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label htmlFor="expires_in">Expira em (dias)</Label>
                                <Input
                                  id="expires_in"
                                  type="number"
                                  value={counterForm.expires_in_days}
                                  onChange={(e) => setCounterForm({...counterForm, expires_in_days: e.target.value})}
                                  min="1"
                                  max="30"
                                />
                              </div>
                              <Button onClick={submitCounterProposal} disabled={loading} className="w-full">
                                Enviar Contra-proposta
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="default" size="sm" disabled={expired}>
                          <Check className="h-3 w-3 mr-1" />
                          Aceitar
                        </Button>
                        
                        <Button variant="destructive" size="sm" disabled={expired}>
                          <X className="h-3 w-3 mr-1" />
                          Rejeitar
                        </Button>
                      </div>

                      {expired && (
                        <Alert className="mt-4">
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            Esta proposta expirou em {formatDistanceToNow(new Date(proposal.expires_at), { locale: ptBR })}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}