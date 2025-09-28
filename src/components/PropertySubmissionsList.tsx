import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';
import { PropertyImportPreviewModal } from './PropertyImportPreviewModal';
import { asPropertySubmissionArray } from '@/utils/typeCompat';
import { 
  Eye, 
  Check, 
  X, 
  Copy,
  User,
  Calendar,
  Home
} from 'lucide-react';

interface PropertySubmission {
  id: string;
  submission_token: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  property_data: any;
  photos: string[];
  marketing_consent: boolean;
  exclusivity_type: 'exclusive' | 'non_exclusive';
  status: 'pending' | 'approved' | 'imported' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
}

interface PropertySubmissionsListProps {
  onImport: () => void;
}

export function PropertySubmissionsList({ onImport }: PropertySubmissionsListProps) {
  const { broker } = useBroker();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<PropertySubmission | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [broker]);

  const loadSubmissions = async () => {
    if (!broker?.id) return;

    try {
      const { data, error } = await supabase
        .from('property_submissions')
        .select('*')
        .eq('broker_id', broker.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading submissions:', error);
        toast.error('Erro ao carregar envios');
        return;
      }

      setSubmissions(asPropertySubmissionArray(data) || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (
    submissionId: string, 
    status: string, 
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('property_submissions')
        .update({
          status,
          notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Erro ao atualizar status');
        return;
      }

      toast.success('Status atualizado!');
      loadSubmissions();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const openPreviewModal = (submission: PropertySubmission) => {
    setSelectedSubmission(submission);
    setPreviewModalOpen(true);
  };

  const handleImportComplete = () => {
    loadSubmissions();
    onImport();
  };

  const copySubmissionLink = (token: string) => {
    const url = `${window.location.origin}/formulario-imovel/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'imported': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando envios...</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium mb-2">Nenhum envio pendente</h3>
          <p className="text-sm text-muted-foreground">
            Quando proprietários enviarem formulários, eles aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Envios Pendentes ({submissions.length})</h3>
          <Badge variant="secondary">
            {submissions.length} pendente{submissions.length !== 1 ? 's' : ''}
          </Badge>
        </div>

      <div className="grid gap-3">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <h4 className="font-medium">
                    {submission.property_data?.titulo || 'Título não informado'}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {submission.owner_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(submission.submitted_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {submission.exclusivity_type === 'exclusive' && (
                  <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                    🏆 Exclusiva
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-medium">
                    R$ {submission.property_data?.valor?.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cidade:</span>
                  <p className="font-medium">
                    {submission.property_data?.cidade}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fotos:</span>
                  <p className="font-medium">
                    {submission.photos?.length || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copySubmissionLink(submission.submission_token)}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Link
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50 flex items-center gap-1"
                  onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                >
                  <Check className="w-3 h-3" />
                  Aprovar
                </Button>

                <Button
                  size="sm"
                  onClick={() => openPreviewModal(submission)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Visualizar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-1"
                  onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                >
                  <X className="w-3 h-3" />
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>

      <PropertyImportPreviewModal
        submission={selectedSubmission}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        onImport={handleImportComplete}
        brokerUserId={broker?.user_id}
      />
    </>
  );
}