import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  titulo: string;
  sale_status: string;
  auto_delete_at?: string;
}

interface PropertyStatusManagerProps {
  property: Property;
  onStatusUpdate?: () => void;
}

export function PropertyStatusManager({ property, onStatusUpdate }: PropertyStatusManagerProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === property.sale_status) return;

    setIsChanging(true);
    try {
      // Call auto-cleanup function to handle the status change
      const { error } = await supabase.functions.invoke('auto-cleanup', {
        body: {
          property_id: property.id,
          status: newStatus,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Status atualizado",
        description: `Imóvel marcado como ${newStatus === 'sold' ? 'vendido' : 'alugado'}. Será removido automaticamente em 7 dias.`,
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error('Error updating property status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do imóvel.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
      setNewStatus('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sold':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Vendido</Badge>;
      case 'rented':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Alugado</Badge>;
      default:
        return <Badge variant="outline">Disponível</Badge>;
    }
  };

  const getDaysUntilDeletion = () => {
    if (!property.auto_delete_at) return null;
    
    const deleteDate = new Date(property.auto_delete_at);
    const now = new Date();
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntilDeletion = getDaysUntilDeletion();

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge(property.sale_status)}
      
      {daysUntilDeletion !== null && daysUntilDeletion > 0 && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {daysUntilDeletion}d para exclusão
        </Badge>
      )}
      
      {property.sale_status === 'available' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              Marcar como
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Atualizar Status do Imóvel</AlertDialogTitle>
              <AlertDialogDescription>
                Selecione o novo status para o imóvel "{property.titulo}".
                <br />
                <strong>Atenção:</strong> Imóveis marcados como vendidos ou alugados são automaticamente removidos do sistema em 7 dias.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sold">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Vendido
                    </div>
                  </SelectItem>
                  <SelectItem value="rented">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Alugado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStatusChange}
                disabled={!newStatus || isChanging}
                className="bg-primary hover:bg-primary/90"
              >
                {isChanging ? 'Atualizando...' : 'Confirmar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {property.sale_status !== 'available' && property.auto_delete_at && (
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            // Cancel auto-deletion
            try {
              const { error } = await supabase
                .from('properties')
                .update({
                  sale_status: 'available',
                  auto_delete_at: null,
                  marked_as_sold_at: null,
                  marked_as_rented_at: null,
                  is_public: true
                })
                .eq('id', property.id);

              if (error) throw error;

              toast({
                title: "Status restaurado",
                description: "Imóvel voltou para disponível e a exclusão automática foi cancelada.",
              });

              onStatusUpdate?.();
            } catch (error) {
              console.error('Error canceling deletion:', error);
              toast({
                title: "Erro",
                description: "Erro ao cancelar exclusão automática.",
                variant: "destructive",
              });
            }
          }}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Cancelar exclusão
        </Button>
      )}
    </div>
  );
}