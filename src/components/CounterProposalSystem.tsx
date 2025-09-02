import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, parseValueInput } from '@/lib/utils';

interface Proposal {
  id: string;
  property_id: string;
  property_title?: string;
  property_value?: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  offer_amount: number;
  financing_type: string;
  down_payment?: number;
  conditions: string;
  expires_at: string;
  status: string;
  created_at: string;
  counter_proposals: CounterProposal[];
}

interface CounterProposal {
  id: string;
  proposal_id: string;
  offer_amount: number;
  conditions: string;
  message: string;
  expires_at: string;
  status: string;
  created_by: string;
  created_at: string;
  created_by_name?: string;
}

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
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isCounterDialogOpen, setIsCounterDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [proposalForm, setProposalForm] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    offer_amount: '',
    financing_type: 'financiado',
    down_payment: '',
    conditions: '',
    message: ''
  });

  const [counterForm, setCounterForm] = useState({
    offer_amount: '',
    conditions: '',
    message: '',
    expires_in_days: '7'
  });

  useEffect(() => {
    if (propertyId) {
      fetchProposals();
    } else {
      fetchAllProposals();
    }
  }, [propertyId]);

  const fetchProposals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Simulated data - replace with real Supabase query
      const mockProposals: Proposal[] = [
        {
          id: '1',
          property_id: propertyId || 'prop-1',
          property_title: propertyTitle || 'Apartamento 3 quartos Vila Madalena',
          property_value: propertyValue || 650000,
          buyer_name: 'João Silva',
          buyer_email: 'joao@email.com',
          buyer_phone: '(11) 99999-9999',
          offer_amount: 600000,
          financing_type: 'financiado',
          down_payment: 150000,
          conditions: 'Financiamento aprovado, documentação ok',
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          status: 'active',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          counter_proposals: [
            {
              id: 'counter-1',
              proposal_id: '1',
              offer_amount: 630000,
              conditions: 'Aceito com ajuste no valor',
              message: 'Posso fazer por R$ 630.000 à vista ou R$ 650.000 parcelado',
              expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
              status: 'active',
              created_by: user.id,
              created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
              created_by_name: 'Corretor'
            }
          ]
        },
        {
          id: '2',
          property_id: 'prop-2',
          property_title: 'Casa 4 quartos Jardins',
          property_value: 1200000,
          buyer_name: 'Maria Santos',
          buyer_email: 'maria@email.com',
          buyer_phone: '(11) 88888-8888',
          offer_amount: 1100000,
          financing_type: 'vista',
          conditions: 'Pagamento à vista, entrega em 30 dias',
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          status: 'pending',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          counter_proposals: []
        }
      ];

      if (propertyId) {
        setProposals(mockProposals.filter(p => p.property_id === propertyId));
      } else {
        setProposals(mockProposals);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar propostas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProposals = async () => {
    // Fetch all proposals for the current user
    await fetchProposals();
  };

  const submitProposal = async () => {
    if (!propertyId || !proposalForm.buyer_name || !proposalForm.offer_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newProposal: Proposal = {
        id: Date.now().toString(),
        property_id: propertyId,
        property_title: propertyTitle,
        property_value: propertyValue,
        buyer_name: proposalForm.buyer_name,
        buyer_email: proposalForm.buyer_email,
        buyer_phone: proposalForm.buyer_phone,
        offer_amount: parseValueInput(proposalForm.offer_amount),
        financing_type: proposalForm.financing_type,
        down_payment: proposalForm.down_payment ? parseValueInput(proposalForm.down_payment) : undefined,
        conditions: proposalForm.conditions,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        counter_proposals: []
      };

      setProposals(prev => [newProposal, ...prev]);

      toast({
        title: "Proposta enviada!",
        description: "A proposta foi registrada com sucesso",
      });

      // Reset form
      setProposalForm({
        buyer_name: '',
        buyer_email: '',
        buyer_phone: '',
        offer_amount: '',
        financing_type: 'financiado',
        down_payment: '',
        conditions: '',
        message: ''
      });

      onProposalSubmit?.();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar proposta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitCounterProposal = async () => {
    if (!selectedProposal || !counterForm.offer_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newCounter: CounterProposal = {
        id: Date.now().toString(),
        proposal_id: selectedProposal.id,
        offer_amount: parseValueInput(counterForm.offer_amount),
        conditions: counterForm.conditions,
        message: counterForm.message,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * parseInt(counterForm.expires_in_days)).toISOString(),
        status: 'active',
        created_by: user?.id || '',
        created_at: new Date().toISOString(),
        created_by_name: 'Corretor'
      };

      // Update proposals with new counter
      setProposals(prev => prev.map(proposal => 
        proposal.id === selectedProposal.id 
          ? { ...proposal, counter_proposals: [...proposal.counter_proposals, newCounter] }
          : proposal
      ));

      toast({
        title: "Contra-proposta enviada!",
        description: "Sua contra-proposta foi registrada",
      });

      setIsCounterDialogOpen(false);
      setCounterForm({
        offer_amount: '',
        conditions: '',
        message: '',
        expires_in_days: '7'
      });
    } catch (error) {
      console.error('Error submitting counter proposal:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar contra-proposta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const getLastCounterOffer = (proposal: Proposal) => {
    if (proposal.counter_proposals.length === 0) return proposal.offer_amount;
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
      {/* New Proposal Form (only show if propertyId is provided) */}
      {propertyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nova Proposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyer_name">Nome do Interessado *</Label>
                <Input
                  id="buyer_name"
                  value={proposalForm.buyer_name}
                  onChange={(e) => setProposalForm({...proposalForm, buyer_name: e.target.value})}
                  placeholder="João Silva"
                />
              </div>
              <div>
                <Label htmlFor="buyer_email">Email</Label>
                <Input
                  id="buyer_email"
                  type="email"
                  value={proposalForm.buyer_email}
                  onChange={(e) => setProposalForm({...proposalForm, buyer_email: e.target.value})}
                  placeholder="joao@email.com"
                />
              </div>
              <div>
                <Label htmlFor="buyer_phone">Telefone</Label>
                <Input
                  id="buyer_phone"
                  value={proposalForm.buyer_phone}
                  onChange={(e) => setProposalForm({...proposalForm, buyer_phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="offer_amount">Valor da Proposta *</Label>
                <Input
                  id="offer_amount"
                  value={proposalForm.offer_amount}
                  onChange={(e) => setProposalForm({...proposalForm, offer_amount: e.target.value})}
                  placeholder="600.000,00"
                />
              </div>
              <div>
                <Label htmlFor="financing_type">Tipo de Pagamento</Label>
                <select
                  id="financing_type"
                  value={proposalForm.financing_type}
                  onChange={(e) => setProposalForm({...proposalForm, financing_type: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="financiado">Financiado</option>
                  <option value="vista">À Vista</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>
              {proposalForm.financing_type === 'financiado' && (
                <div>
                  <Label htmlFor="down_payment">Entrada</Label>
                  <Input
                    id="down_payment"
                    value={proposalForm.down_payment}
                    onChange={(e) => setProposalForm({...proposalForm, down_payment: e.target.value})}
                    placeholder="150.000,00"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="conditions">Condições</Label>
              <Textarea
                id="conditions"
                value={proposalForm.conditions}
                onChange={(e) => setProposalForm({...proposalForm, conditions: e.target.value})}
                placeholder="Condições da proposta..."
                rows={3}
              />
            </div>
            <Button onClick={submitProposal} disabled={loading} className="w-full">
              Registrar Proposta
            </Button>
          </CardContent>
        </Card>
      )}

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
                          <h3 className="font-semibold">{proposal.property_title}</h3>
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
                          <p className="font-semibold">{formatCurrency(proposal.property_value || 0)}</p>
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
                                    <span className="font-medium text-sm">{counter.created_by_name}</span>
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