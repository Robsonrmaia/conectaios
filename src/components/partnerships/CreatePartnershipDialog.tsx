import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface CreatePartnershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyOwnerId: string;
  propertyTitle: string;
  onSuccess?: () => void;
}

export function CreatePartnershipDialog({
  isOpen,
  onClose,
  propertyId,
  propertyOwnerId,
  propertyTitle,
  onSuccess
}: CreatePartnershipDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myPercentage, setMyPercentage] = useState(50);
  const [ownerPercentage, setOwnerPercentage] = useState(50);
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);

  const handleMyPercentageChange = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setMyPercentage(clamped);
    setOwnerPercentage(100 - clamped);
  };

  const handleOwnerPercentageChange = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setOwnerPercentage(clamped);
    setMyPercentage(100 - clamped);
  };

  const handleSubmit = async () => {
    if (!user) return;

    const total = myPercentage + ownerPercentage;
    if (Math.abs(total - 100) > 0.01) {
      toast.error('A soma das comissões deve ser exatamente 100%');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-partnership', {
        body: {
          property_id: propertyId,
          target_broker_id: propertyOwnerId,
          proposed_split: {
            [user.id]: myPercentage,
            [propertyOwnerId]: ownerPercentage
          },
          message,
          expires_in_days: expiresInDays
        }
      });

      if (error) throw error;

      toast.success('Proposta de parceria enviada com sucesso!');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating partnership:', error);
      toast.error(error.message || 'Erro ao criar proposta de parceria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🤝 Propor Parceria</DialogTitle>
          <DialogDescription>
            Imóvel: {propertyTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Divisão de Comissão</Label>
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Você</span>
                  <span className="text-sm font-medium">{myPercentage}%</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={myPercentage}
                  onChange={(e) => handleMyPercentageChange(Number(e.target.value))}
                />
                <div className="h-2 bg-secondary rounded-full mt-2">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${myPercentage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Proprietário do imóvel</span>
                  <span className="text-sm font-medium">{ownerPercentage}%</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={ownerPercentage}
                  onChange={(e) => handleOwnerPercentageChange(Number(e.target.value))}
                />
                <div className="h-2 bg-secondary rounded-full mt-2">
                  <div 
                    className="h-full bg-secondary-foreground rounded-full transition-all"
                    style={{ width: `${ownerPercentage}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-center">
                Total: {myPercentage + ownerPercentage}% 
                {Math.abs(myPercentage + ownerPercentage - 100) > 0.01 && (
                  <span className="text-destructive ml-2">❌</span>
                )}
                {Math.abs(myPercentage + ownerPercentage - 100) <= 0.01 && (
                  <span className="text-green-500 ml-2">✓</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Tenho cliente interessado para esse imóvel..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="expires">Validade da proposta</Label>
            <select
              id="expires"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
            >
              <option value={3}>3 dias</option>
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
              <option value={30}>30 dias</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || Math.abs(myPercentage + ownerPercentage - 100) > 0.01}
              className="flex-1"
            >
              {loading ? 'Enviando...' : 'Enviar Proposta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
