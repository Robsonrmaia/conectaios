import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Ruler, 
  Bed, 
  Bath, 
  Car, 
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  FileText,
  Check,
  X,
  Download
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

interface PropertyImportPreviewModalProps {
  submission: PropertySubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
  brokerUserId?: string;
}

export function PropertyImportPreviewModal({
  submission,
  open,
  onOpenChange,
  onImport,
  brokerUserId
}: PropertyImportPreviewModalProps) {
  
  const handleImport = async () => {
    if (!submission || !brokerUserId) return;

    try {
      const propertyData = submission.property_data;
      
      // Create property record
      const { error } = await supabase
        .from('properties')
        .insert({
          user_id: brokerUserId,
          titulo: propertyData.titulo,
          descricao: propertyData.descricao,
          valor: propertyData.valor,
          listing_type: propertyData.listing_type,
          property_type: propertyData.property_type,
          area: propertyData.area,
          quartos: propertyData.quartos,
          bathrooms: propertyData.banheiros,
          parking_spots: propertyData.vagas,
          condominium_fee: propertyData.condominio || 0,
          iptu: propertyData.iptu || 0,
          address: propertyData.endereco,
          neighborhood: propertyData.bairro,
          city: propertyData.cidade,
          state: propertyData.estado,
          zipcode: propertyData.cep,
          fotos: submission.photos,
          is_public: true,
          visibility: 'public_site'
        });

      if (error) {
        console.error('Error importing property:', error);
        toast.error('Erro ao importar imóvel');
        return;
      }

      // Update submission status
      await supabase
        .from('property_submissions')
        .update({
          status: 'imported',
          notes: 'Importado para Meus Imóveis',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id);
      
      toast.success('Imóvel importado com sucesso!');
      onOpenChange(false);
      onImport();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao importar');
    }
  };

  const handleReject = async () => {
    if (!submission) return;

    try {
      await supabase
        .from('property_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id);
      
      toast.success('Submissão rejeitada');
      onOpenChange(false);
      onImport();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao rejeitar');
    }
  };

  if (!submission) return null;

  const propertyData = submission.property_data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Visualizar Imóvel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Dados do Proprietário
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{submission.owner_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{submission.owner_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{submission.owner_phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Property Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Informações Básicas
                </span>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {propertyData.listing_type === 'venda' ? 'Venda' : 
                     propertyData.listing_type === 'aluguel' ? 'Aluguel' : 'Temporada'}
                  </Badge>
                  <Badge variant="secondary">
                    {propertyData.property_type === 'apartamento' ? 'Apartamento' :
                     propertyData.property_type === 'casa' ? 'Casa' :
                     propertyData.property_type === 'terreno' ? 'Terreno' :
                     propertyData.property_type === 'comercial' ? 'Comercial' : 'Rural'}
                  </Badge>
                  {submission.exclusivity_type === 'exclusive' && (
                    <Badge className="bg-green-100 text-green-800">🏆 Exclusiva</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">{propertyData.titulo}</h3>
                <p className="text-sm text-muted-foreground">{propertyData.descricao}</p>
              </div>
              
              <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                <DollarSign className="w-5 h-5" />
                R$ {propertyData.valor?.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Características
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span>{propertyData.area}m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-muted-foreground" />
                  <span>{propertyData.quartos || 0} quartos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-4 h-4 text-muted-foreground" />
                  <span>{propertyData.banheiros || 0} banheiros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span>{propertyData.vagas || 0} vagas</span>
                </div>
                {propertyData.ano_construcao && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{propertyData.ano_construcao}</span>
                  </div>
                )}
              </div>
              
              {(propertyData.condominio || propertyData.iptu) && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                  {propertyData.condominio && (
                    <div>
                      <span className="text-muted-foreground">Condomínio:</span>
                      <p className="font-medium">R$ {propertyData.condominio.toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                  {propertyData.iptu && (
                    <div>
                      <span className="text-muted-foreground">IPTU:</span>
                      <p className="font-medium">R$ {propertyData.iptu.toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-2">
                <p><span className="font-medium">Endereço:</span> {propertyData.endereco}</p>
                <p><span className="font-medium">Bairro:</span> {propertyData.bairro}</p>
                <div className="flex gap-4">
                  <p><span className="font-medium">Cidade:</span> {propertyData.cidade}</p>
                  <p><span className="font-medium">Estado:</span> {propertyData.estado}</p>
                  <p><span className="font-medium">CEP:</span> {propertyData.cep}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {submission.photos && submission.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Fotos ({submission.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {submission.photos.slice(0, 8).map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={photo} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    </div>
                  ))}
                  {submission.photos.length > 8 && (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                      +{submission.photos.length - 8} fotos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Consentimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Autoriza divulgação do imóvel</span>
                </div>
                <div className="flex items-center gap-2">
                  {submission.exclusivity_type === 'exclusive' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-yellow-600" />
                  )}
                  <span>
                    {submission.exclusivity_type === 'exclusive' 
                      ? 'Representação Exclusiva' 
                      : 'Representação Não-Exclusiva'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Rejeitar
          </Button>
          <Button 
            onClick={handleImport}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-1" />
            Confirmar Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}