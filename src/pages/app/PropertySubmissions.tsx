import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, CheckCircle, Clock, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Properties } from "@/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PropertySubmission {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  property_data: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PropertySubmissions() {
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<PropertySubmission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedSubmissions: PropertySubmission[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        message: item.message,
        property_data: item.property_data,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setSubmissions(mappedSubmissions);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Erro ao carregar submissões");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('property_submissions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(sub => sub.id === id ? { ...sub, status } : sub)
      );
      toast.success("Status atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const convertToProperty = async (submission: PropertySubmission) => {
    try {
      const propertyData = submission.property_data;
      
      await Properties.create({
        title: propertyData.title || `Imóvel de ${submission.name}`,
        description: propertyData.description || submission.message || '',
        type: propertyData.type || 'house',
        purpose: propertyData.purpose || 'sale',
        price: propertyData.price ? Number(propertyData.price) : null,
        bedrooms: propertyData.bedrooms || null,
        bathrooms: propertyData.bathrooms || null,
        area_total: propertyData.area_total || null,
        city: propertyData.city || '',
        neighborhood: propertyData.neighborhood || '',
        street: propertyData.street || '',
        status: 'available',
        visibility: 'private',
        owner_id: '' // Will be set by RLS
      });

      await updateStatus(submission.id, 'converted');
      toast.success("Imóvel criado com sucesso!");
    } catch (error) {
      console.error("Error converting submission:", error);
      toast.error("Erro ao converter submissão");
    }
  };

  const viewDetails = (submission: PropertySubmission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'converted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'default';
      case 'converted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'converted':
        return 'Convertido';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando submissões...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Submissões de Imóveis
        </h1>
        <p className="text-muted-foreground">
          Gerencie submissões de imóveis enviadas por proprietários
        </p>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="truncate">{submission.name || 'Sem nome'}</span>
                <Badge variant={getStatusColor(submission.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(submission.status)}
                    {getStatusLabel(submission.status)}
                  </div>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {submission.email && <p>📧 {submission.email}</p>}
                  {submission.phone && <p>📱 {submission.phone}</p>}
                  <p>📅 {new Date(submission.created_at).toLocaleDateString('pt-BR')}</p>
                </div>

                {submission.property_data?.title && (
                  <div className="text-sm">
                    <p className="font-medium">{submission.property_data.title}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewDetails(submission)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detalhes
                  </Button>

                  {submission.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => convertToProperty(submission)}
                      className="flex-1"
                    >
                      Converter
                    </Button>
                  )}
                </div>

                {submission.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(submission.id, 'approved')}
                      className="flex-1"
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(submission.id, 'rejected')}
                      className="flex-1"
                    >
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {submissions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma submissão encontrada</h3>
            <p className="text-muted-foreground">
              Submissões de imóveis aparecerão aqui quando proprietários enviarem seus imóveis
            </p>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Submissão</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Informações do Contato</h4>
                  <p><strong>Nome:</strong> {selectedSubmission.name || 'Não informado'}</p>
                  <p><strong>Email:</strong> {selectedSubmission.email || 'Não informado'}</p>
                  <p><strong>Telefone:</strong> {selectedSubmission.phone || 'Não informado'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge variant={getStatusColor(selectedSubmission.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedSubmission.status)}
                      {getStatusLabel(selectedSubmission.status)}
                    </div>
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Criado em: {new Date(selectedSubmission.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {selectedSubmission.message && (
                <div>
                  <h4 className="font-semibold">Mensagem</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedSubmission.message}</p>
                </div>
              )}

              {selectedSubmission.property_data && (
                <div>
                  <h4 className="font-semibold">Dados do Imóvel</h4>
                  <div className="text-sm bg-muted p-3 rounded">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedSubmission.property_data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}