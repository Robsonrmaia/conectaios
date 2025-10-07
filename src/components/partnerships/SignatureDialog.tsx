import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partnershipId: string;
  onSuccess?: () => void;
}

export function SignatureDialog({
  isOpen,
  onClose,
  partnershipId,
  onSuccess
}: SignatureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!password) {
      toast.error('Por favor, digite sua senha');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sign-partnership-contract', {
        body: {
          partnership_id: partnershipId,
          password
        }
      });

      if (error) throw error;

      if (data.all_signed) {
        toast.success('🎉 Contrato assinado! Parceria ativada com sucesso!');
      } else {
        toast.success('Assinatura registrada! Aguardando assinatura dos demais participantes.');
      }
      
      setPassword('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error signing contract:', error);
      if (error.message?.includes('Invalid password')) {
        toast.error('Senha incorreta. Por favor, tente novamente.');
      } else {
        toast.error(error.message || 'Erro ao assinar contrato');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Assinar Contrato
          </DialogTitle>
          <DialogDescription>
            Para confirmar sua participação nesta parceria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              ⚠️ Ao assinar, você concorda com os termos do contrato de parceria e a divisão de comissão acordada.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="password">Digite sua senha do ConectaIOS</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !password}
              className="flex-1"
            >
              {loading ? 'Verificando...' : 'Confirmar Assinatura'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
