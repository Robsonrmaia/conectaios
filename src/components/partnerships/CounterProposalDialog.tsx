import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CounterProposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string;
  currentSplit: Record<string, number>;
  onSuccess?: () => void;
}

export function CounterProposalDialog({
  isOpen,
  onClose,
  proposalId,
  currentSplit,
  onSuccess
}: CounterProposalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [newSplit, setNewSplit] = useState(currentSplit);
  const [message, setMessage] = useState('');

  const brokerIds = Object.keys(currentSplit);
  const total = Object.values(newSplit).reduce((sum, val) => sum + val, 0);

  const handlePercentageChange = (brokerId: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setNewSplit(prev => ({ ...prev, [brokerId]: clamped }));
  };

  const handleSubmit = async () => {
    if (Math.abs(total - 100) > 0.01) {
      toast.error('A soma das comissões deve ser exatamente 100%');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('respond-partnership-proposal', {
        body: {
          proposal_id: proposalId,
          action: 'counter',
          counter_split: newSplit,
          message
        }
      });

      if (error) throw error;

      toast.success('Contraproposta enviada com sucesso!');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating counter proposal:', error);
      toast.error(error.message || 'Erro ao criar contraproposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🔄 Fazer Contraproposta</DialogTitle>
          <DialogDescription>
            Sugira uma nova divisão de comissão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nova Divisão de Comissão</Label>
            <div className="space-y-3 mt-2">
              {brokerIds.map((brokerId, index) => (
                <div key={brokerId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Corretor {index + 1}</span>
                    <span className="text-sm font-medium">{newSplit[brokerId]}%</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newSplit[brokerId]}
                    onChange={(e) => handlePercentageChange(brokerId, Number(e.target.value))}
                  />
                  <div className="h-2 bg-secondary rounded-full mt-2">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${newSplit[brokerId]}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="text-sm text-center">
                Total: {total.toFixed(1)}% 
                {Math.abs(total - 100) > 0.01 && (
                  <span className="text-destructive ml-2">❌</span>
                )}
                {Math.abs(total - 100) <= 0.01 && (
                  <span className="text-green-500 ml-2">✓</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="counter-message">Mensagem (opcional)</Label>
            <Textarea
              id="counter-message"
              placeholder="Sugiro essa nova divisão porque..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || Math.abs(total - 100) > 0.01}
              className="flex-1"
            >
              {loading ? 'Enviando...' : 'Enviar Contraproposta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
