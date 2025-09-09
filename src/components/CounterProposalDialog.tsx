import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, MessageSquare, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
}

interface CounterProposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  matchScore: number;
}

export function CounterProposalDialog({ isOpen, onClose, property, matchScore }: CounterProposalDialogProps) {
  const [proposalData, setProposalData] = useState({
    offerAmount: property?.valor || 0,
    conditions: '',
    message: '',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    downPayment: 0,
    financingAmount: 0,
  });

  const handleSubmit = async () => {
    try {
      // Here you would integrate with your backend to save the proposal
      toast({
        title: "Proposta enviada!",
        description: `Sua proposta de ${proposalData.offerAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi enviada`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar proposta",
        variant: "destructive",
      });
    }
  };

  const handleOfferChange = (value: number) => {
    setProposalData(prev => ({
      ...prev,
      offerAmount: value,
      financingAmount: value - prev.downPayment
    }));
  };

  const handleDownPaymentChange = (value: number) => {
    setProposalData(prev => ({
      ...prev,
      downPayment: value,
      financingAmount: prev.offerAmount - value
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Fazer Proposta</DialogTitle>
            <Badge className={`${getScoreColor(matchScore)} text-white`}>
              {matchScore}% Match
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{property?.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <div className="font-medium text-primary">
                    {property?.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Área:</span>
                  <div className="font-medium">{property?.area}m²</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Quartos:</span>
                  <div className="font-medium">{property?.quartos}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="offer">Valor da Proposta</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="offer"
                    type="number"
                    value={proposalData.offerAmount}
                    onChange={(e) => handleOfferChange(Number(e.target.value))}
                    className="pl-10"
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="validUntil">Válida até</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="validUntil"
                    type="date"
                    value={proposalData.validUntil}
                    onChange={(e) => setProposalData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="downPayment">Entrada</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={proposalData.downPayment}
                  onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                  placeholder="R$ 0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="financing">Financiamento</Label>
                <Input
                  id="financing"
                  type="number"
                  value={proposalData.financingAmount}
                  readOnly
                  className="bg-muted"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="conditions">Condições</Label>
              <Input
                id="conditions"
                value={proposalData.conditions}
                onChange={(e) => setProposalData(prev => ({ ...prev, conditions: e.target.value }))}
                placeholder="Ex: Sujeito a aprovação de financiamento"
              />
            </div>

            <div>
              <Label htmlFor="message">Mensagem para o vendedor</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="message"
                  value={proposalData.message}
                  onChange={(e) => setProposalData(prev => ({ ...prev, message: e.target.value }))}
                  className="pl-10 pt-10"
                  placeholder="Adicione uma mensagem personalizada..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Resumo da Proposta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Valor proposto:</span>
                <span className="font-medium">
                  {proposalData.offerAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Diferença do valor pedido:</span>
                <span className={`font-medium ${proposalData.offerAmount < property?.valor ? 'text-red-600' : 'text-green-600'}`}>
                  {((proposalData.offerAmount - property?.valor) / property?.valor * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Válida até:</span>
                <span className="font-medium">
                  {new Date(proposalData.validUntil).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Enviar Proposta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}