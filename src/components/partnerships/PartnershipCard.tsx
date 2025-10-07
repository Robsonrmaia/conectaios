import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { CounterProposalDialog } from './CounterProposalDialog';
import { SignatureDialog } from './SignatureDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface PartnershipCardProps {
  partnership: any;
  onRefetch: () => void;
}

export function PartnershipCard({ partnership, onRefetch }: PartnershipCardProps) {
  const { user } = useAuth();
  const [showCounterDialog, setShowCounterDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const latestProposal = partnership.proposals?.[0];
  const myParticipant = partnership.participants?.find((p: any) => p.broker_id === user?.id);
  const isExpired = partnership.expires_at && new Date(partnership.expires_at) < new Date();

  const getStatusBadge = () => {
    if (partnership.status === 'active') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Ativa</Badge>;
    }
    if (partnership.status === 'rejected') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejeitada</Badge>;
    }
    if (isExpired) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Expirada</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
  };

  const handleAccept = async () => {
    if (!latestProposal) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('respond-partnership-proposal', {
        body: {
          proposal_id: latestProposal.id,
          action: 'accept'
        }
      });

      if (error) throw error;
      toast.success('Proposta aceita! Pronto para assinar.');
      onRefetch();
    } catch (error: any) {
      console.error('Error accepting proposal:', error);
      toast.error(error.message || 'Erro ao aceitar proposta');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!latestProposal) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('respond-partnership-proposal', {
        body: {
          proposal_id: latestProposal.id,
          action: 'reject'
        }
      });

      if (error) throw error;
      toast.success('Proposta rejeitada');
      onRefetch();
    } catch (error: any) {
      console.error('Error rejecting proposal:', error);
      toast.error(error.message || 'Erro ao rejeitar proposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{partnership.property?.title}</CardTitle>
              <CardDescription>
                Ref: {partnership.property?.reference_code} • 
                R$ {partnership.property?.price?.toLocaleString('pt-BR')}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Divisão de Comissão:</div>
            <div className="space-y-1">
              {Object.entries(partnership.commission_split as Record<string, number>).map(([brokerId, percentage]) => {
                const participant = partnership.participants?.find((p: any) => p.broker_id === brokerId);
                return (
                  <div key={brokerId} className="flex items-center justify-between text-sm">
                    <span>{participant?.role === 'owner' ? '👤 Proprietário' : '🤝 Parceiro'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{percentage}%</span>
                      {participant?.signed && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {latestProposal?.message && (
            <div className="bg-muted p-3 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Mensagem:</div>
              <div className="text-sm">{latestProposal.message}</div>
            </div>
          )}

          {partnership.status === 'pending' && !isExpired && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReject}
                disabled={loading}
                className="flex-1"
              >
                Rejeitar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCounterDialog(true)}
                disabled={loading}
                className="flex-1"
              >
                Contrapropor
              </Button>
              <Button 
                onClick={handleAccept}
                disabled={loading}
                className="flex-1"
              >
                Aceitar
              </Button>
            </div>
          )}

          {partnership.status === 'active' && !partnership.contract_signed && myParticipant && !myParticipant.signed && (
            <Button 
              onClick={() => setShowSignDialog(true)}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Assinar Contrato
            </Button>
          )}

          {partnership.contract_signed && (
            <div className="text-center text-sm text-green-600">
              ✅ Contrato assinado por todos os participantes
            </div>
          )}

          {isExpired && partnership.status === 'pending' && (
            <div className="text-center text-sm text-muted-foreground">
              Esta proposta expirou em {new Date(partnership.expires_at).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {latestProposal && (
        <CounterProposalDialog
          isOpen={showCounterDialog}
          onClose={() => setShowCounterDialog(false)}
          proposalId={latestProposal.id}
          currentSplit={partnership.commission_split}
          onSuccess={onRefetch}
        />
      )}

      <SignatureDialog
        isOpen={showSignDialog}
        onClose={() => setShowSignDialog(false)}
        partnershipId={partnership.id}
        onSuccess={onRefetch}
      />
    </>
  );
}
