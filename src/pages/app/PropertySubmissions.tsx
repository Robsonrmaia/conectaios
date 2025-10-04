import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';
import { 
  Eye, 
  Check, 
  X, 
  Share2, 
  Plus, 
  Search,
  Calendar,
  User,
  Home,
  Shield,
  ExternalLink,
  Copy
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

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

export default function PropertySubmissions() {
  const navigate = useNavigate();
  const { broker } = useBroker();
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<PropertySubmission | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading submissions:', error);
        toast.error('Erro ao carregar envios');
        return;
      }

      setSubmissions(data as PropertySubmission[] || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const generateNewLink = async () => {
    if (!broker?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-submission-token', {
        body: { broker_id: broker.id }
      });

      if (error) {
        console.error('Error generating token:', error);
        toast.error('Erro ao gerar link');
        return;
      }

      const publicUrl = data.public_url;
      
      // Copy to clipboard
      navigator.clipboard.writeText(publicUrl);
      toast.success('Link copiado para a área de transferência!');
      
      // Refresh submissions
      loadSubmissions();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao gerar link');
    }
  };

  const copySubmissionLink = (token: string) => {
    const url = `${window.location.origin}/formulario-imovel/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
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
      setPreviewOpen(false);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const importToProperties = async (submission: PropertySubmission) => {
    try {
      const propertyData = submission.property_data;
      
      // ⚠️ CRÍTICO: Criação de imóvel via submissão - usa tabela 'imoveis'
      // Create property record
      const { error } = await supabase
        .from('imoveis')
        .insert({
          owner_id: broker?.user_id,
          title: propertyData.titulo,
          description: propertyData.descricao,
          price: propertyData.valor,
          purpose: propertyData.listing_type,
          property_type: propertyData.property_type,
          area_total: propertyData.area,
          bedrooms: propertyData.quartos,
          bathrooms: propertyData.banheiros,
          parking: propertyData.vagas,
          condo_fee: propertyData.condominio,
          iptu: propertyData.iptu,
          address: propertyData.endereco,
          neighborhood: propertyData.bairro,
          city: propertyData.cidade,
          state: propertyData.estado,
          zipcode: propertyData.cep,
          is_public: true,
          visibility: 'public_site'
        });

      if (error) {
        console.error('Error importing property:', error);
        toast.error('Erro ao importar imóvel');
        return;
      }

      // Update submission status
      await updateSubmissionStatus(submission.id, 'imported', 'Importado para Meus Imóveis');
      
      toast.success('Imóvel importado com sucesso!');
      navigate('/app/imoveis');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao importar');
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    const matchesSearch = submission.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.property_data?.titulo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'imported': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'imported': return 'Importado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando envios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Envios de Proprietários</h1>
          <p className="text-muted-foreground">
            Gerencie os formulários enviados pelos proprietários
          </p>
        </div>

        <Button onClick={generateNewLink} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Link de Envio
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por proprietário ou imóvel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="imported">Importados</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum envio encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {submissions.length === 0 
                ? "Ainda não há envios de proprietários. Crie um link para começar!"
                : "Nenhum envio corresponde aos filtros aplicados."
              }
            </p>
            {submissions.length === 0 && (
              <Button onClick={generateNewLink} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Link
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">
                      {submission.property_data?.titulo || 'Título não informado'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {submission.owner_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(submission.submitted_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusLabel(submission.status)}
                    </Badge>
                    
                    {submission.exclusivity_type === 'exclusive' && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        🏆 Exclusiva
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-medium">
                      R$ {submission.property_data?.valor?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium capitalize">
                      {submission.property_data?.property_type}
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
                      {submission.photos?.length || 0} fotos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setPreviewOpen(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copySubmissionLink(submission.submission_token)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </Button>

                  {submission.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                        onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                      >
                        <Check className="w-4 h-4" />
                        Aprovar
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => importToProperties(submission)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Importar Imóvel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  {selectedSubmission.property_data?.titulo}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Owner Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Dados do Proprietário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Nome:</span>
                      <p className="font-medium">{selectedSubmission.owner_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedSubmission.owner_email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Telefone:</span>
                      <p className="font-medium">{selectedSubmission.owner_phone}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Consent & Exclusivity */}
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                      <Shield className="w-5 h-5" />
                      Consentimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedSubmission.marketing_consent ? "default" : "destructive"}>
                        {selectedSubmission.marketing_consent ? "✓ Consentiu" : "✗ Não consentiu"}
                      </Badge>
                      <span className="text-sm">Divulgação do imóvel</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedSubmission.exclusivity_type === 'exclusive' ? "default" : "secondary"}>
                        {selectedSubmission.exclusivity_type === 'exclusive' ? "🏆 Exclusiva" : "🤝 Não-exclusiva"}
                      </Badge>
                      <span className="text-sm">Tipo de representação</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Property Photos */}
                {selectedSubmission.photos && selectedSubmission.photos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Fotos ({selectedSubmission.photos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedSubmission.photos.map((photo, index) => (
                          <div key={index} className="aspect-square">
                            <img
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Property Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes do Imóvel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Descrição:</span>
                      <p className="mt-1">{selectedSubmission.property_data?.descricao}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Valor:</span>
                        <p className="font-medium">
                          R$ {selectedSubmission.property_data?.valor?.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Área:</span>
                        <p className="font-medium">
                          {selectedSubmission.property_data?.area} m²
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Quartos:</span>
                        <p className="font-medium">
                          {selectedSubmission.property_data?.quartos}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Banheiros:</span>
                        <p className="font-medium">
                          {selectedSubmission.property_data?.banheiros}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Endereço:</span>
                      <p className="font-medium">
                        {selectedSubmission.property_data?.endereco}, {selectedSubmission.property_data?.bairro} - {selectedSubmission.property_data?.cidade}/{selectedSubmission.property_data?.estado}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedSubmission.status === 'pending' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Adicione observações sobre este envio..."
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => copySubmissionLink(selectedSubmission.submission_token)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>

                {selectedSubmission.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'rejected')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>

                    <Button
                      variant="outline"
                      className="text-green-600 border-green-300"
                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'approved')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>

                    <Button
                      onClick={() => importToProperties(selectedSubmission)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Importar Imóvel
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}