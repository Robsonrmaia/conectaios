import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Globe, Download, Eye, Edit, Loader2, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/hooks/use-toast';
import { OlxPublicationModal } from './OlxPublicationModal';

interface Property {
  id: string;
  title: string;
  price: number;
  description: string;
  city: string;
  neighborhood: string;
  address: string;
  zipcode: string;
  state: string;
  area_total: number;
  olx_enabled: boolean;
  olx_published_at: string | null;
  olx_data: any;
  imovel_images?: Array<{ url: string; is_cover: boolean }>;
}

export function OlxExportManager() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [xmlPreview, setXmlPreview] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchOlxProperties();
    }
  }, [user?.id]);

  const fetchOlxProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('imoveis')
        .select(`
          id,
          title,
          price,
          description,
          city,
          neighborhood,
          address,
          zipcode,
          state,
          area_total,
          olx_enabled,
          olx_published_at,
          olx_data,
          imovel_images(url, is_cover)
        `)
        .eq('owner_id', user?.id)
        .eq('olx_enabled', true)
        .order('olx_published_at', { ascending: true, nullsFirst: true });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching OLX properties:', error);
      toast({
        title: "Erro ao carregar imóveis",
        description: "Não foi possível buscar os imóveis habilitados para OLX",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateProperty = (property: Property) => {
    const errors: string[] = [];
    const olx = property.olx_data || {};
    
    // VRSync: Title (10-100 chars, sem HTML)
    if (!property.title || property.title.length < 10) {
      errors.push('Título muito curto (mínimo 10 caracteres)');
    }
    if (property.title && property.title.length > 100) {
      errors.push('Título muito longo (máximo 100 caracteres)');
    }
    
    // VRSync: Description (50-3000 chars, sem HTML)
    if (!property.description || property.description.length < 50) {
      errors.push('Descrição muito curta (mínimo 50 caracteres)');
    }
    if (property.description && property.description.length > 3000) {
      errors.push('Descrição muito longa (máximo 3000 caracteres)');
    }
    
    // VRSync: ListPrice/RentalPrice
    if (!property.price || property.price <= 0) {
      errors.push('Preço obrigatório');
    }
    
    // VRSync: Location.State (sigla BA/RJ/SP/MG)
    if (!olx.state_abbr || !['BA', 'RJ', 'SP', 'MG'].includes(olx.state_abbr)) {
      errors.push('Estado inválido (apenas BA, RJ, SP, MG)');
    }
    
    // VRSync: Location.City (obrigatório)
    if (!olx.city || olx.city.trim().length < 2) {
      errors.push('Cidade obrigatória');
    }
    
    // VRSync: Location.Neighborhood (obrigatório)
    if (!olx.neighborhood || olx.neighborhood.trim().length < 3) {
      errors.push('Bairro obrigatório (mínimo 3 caracteres)');
    }
    
    // VRSync: Location.Address (nome da rua, obrigatório)
    if (!olx.address || olx.address.trim().length < 5) {
      errors.push('Endereço/Rua obrigatório (mínimo 5 caracteres)');
    }
    
    // VRSync: Location.StreetNumber (obrigatório)
    if (!olx.street_number || olx.street_number.trim().length === 0) {
      errors.push('Número do endereço obrigatório');
    }
    
    // VRSync: Location.PostalCode (CEP 8 dígitos)
    const cepClean = (olx.postal_code || '').replace(/\D/g, '');
    if (cepClean.length !== 8) {
      errors.push('CEP deve ter 8 dígitos');
    }
    
    // VRSync: Details.LivingArea (obrigatório para apartamentos/casas)
    if (!olx.living_area || olx.living_area <= 0) {
      errors.push('Área útil (LivingArea) obrigatória');
    }
    
    // VRSync: Details.Bedrooms/Bathrooms (condicional para residenciais)
    const isResidential = property.city && 
      ['apartamento', 'casa', 'sobrado', 'cobertura', 'kitnet', 'loft']
      .some(type => property.city?.toLowerCase().includes(type));
    
    if (isResidential) {
      if (!property.imovel_images || property.imovel_images.length < 1) {
        errors.push('Quartos obrigatório para imóveis residenciais');
      }
    }
    
    // VRSync: ContactInfo.Name (obrigatório)
    if (!olx.contact_name || olx.contact_name.trim().length < 3) {
      errors.push('Nome de contato obrigatório (mínimo 3 caracteres)');
    }
    
    // VRSync: ContactInfo.Email (obrigatório, validação)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!olx.contact_email || !emailRegex.test(olx.contact_email)) {
      errors.push('Email de contato inválido');
    }
    
    // VRSync: ContactInfo.Telephone (obrigatório, mínimo 10 dígitos)
    const phoneClean = (olx.contact_phone || '').replace(/\D/g, '');
    if (phoneClean.length < 10) {
      errors.push('Telefone inválido (mínimo 10 dígitos com DDD)');
    }
    
    // VRSync: Media (mínimo 1 imagem JPG)
    const imageCount = property.imovel_images?.length || 0;
    if (imageCount < 1) {
      errors.push('Mínimo 1 imagem obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleGenerateXML = async () => {
    try {
      setIsGenerating(true);

      // Validar todos os imóveis
      const validProperties = properties.filter(p => validateProperty(p).isValid);

      if (validProperties.length === 0) {
        toast({
          title: "Nenhum imóvel válido",
          description: "Todos os imóveis precisam ter dados completos para exportação",
          variant: "destructive",
        });
        return;
      }

      // Chamar Edge Function para gerar XML
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/feeds-olx?broker_id=${broker?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar XML');
      }

      const xmlContent = await response.text();

      // Download automático
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `olx-export-${broker?.id}-${Date.now()}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);

      // Atualizar timestamps
      await Promise.all(
        validProperties.map(p =>
          supabase
            .from('imoveis')
            .update({ olx_published_at: new Date().toISOString() })
            .eq('id', p.id)
        )
      );

      toast({
        title: "✓ XML Gerado!",
        description: `${validProperties.length} imóveis exportados com sucesso`,
      });

      fetchOlxProperties(); // Atualizar lista
    } catch (error) {
      console.error('Error generating XML:', error);
      toast({
        title: "Erro ao gerar XML",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewXML = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://paawojkqrggnuvpnnwrc.supabase.co/functions/v1/feeds-olx?broker_id=${broker?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar preview');
      }

      const xml = await response.text();
      setXmlPreview(xml);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing XML:', error);
      toast({
        title: "Erro ao gerar preview",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleSaveOlxData = async (enabled: boolean, olxData: any) => {
    if (!selectedProperty) return;

    try {
      const { error } = await supabase
        .from('imoveis')
        .update({ 
          olx_enabled: enabled,
          olx_data: olxData 
        })
        .eq('id', selectedProperty.id);

      if (error) throw error;

      toast({
        title: "✓ Dados atualizados",
        description: "Configurações OLX salvas com sucesso",
      });

      fetchOlxProperties();
    } catch (error) {
      console.error('Error saving OLX data:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os dados OLX",
        variant: "destructive",
      });
    }
  };

  if (isLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Restrição de acesso apenas para admins
  if (!isAdmin) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="py-12">
          <Alert variant="destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              A exportação XML OLX está disponível apenas para administradores do sistema.
              Os imóveis marcados para OLX serão incluídos automaticamente na exportação diária.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Exportação XML - OLX
        </CardTitle>
        <CardDescription>
          {properties.length} {properties.length === 1 ? 'imóvel marcado' : 'imóveis marcados'} para exportação
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alert informativo */}
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertTitle>Como funciona</AlertTitle>
          <AlertDescription>
            Imóveis marcados com o botão OLX aparecem aqui. Verifique se todos os dados estão completos e clique em "Gerar XML" para fazer o download do arquivo de exportação.
          </AlertDescription>
        </Alert>

        {/* Tabela de imóveis */}
        {properties.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum imóvel marcado para OLX</p>
            <p className="text-sm">
              Use o botão OLX nos cards dos imóveis para habilitá-los para exportação.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Última Publicação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map(property => {
                    const validation = validateProperty(property);
                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{property.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {property.neighborhood} - {property.city}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {property.olx_published_at 
                            ? new Date(property.olx_published_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : <span className="text-muted-foreground">Nunca</span>
                          }
                        </TableCell>
                        <TableCell>
                          {validation.isValid ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Pronto
                            </Badge>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Badge variant="destructive" className="gap-1 cursor-pointer">
                                  <AlertCircle className="h-3 w-3" />
                                  Incompleto ({validation.errors.length})
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">Campos faltantes:</h4>
                                  <ul className="text-xs space-y-1">
                                    {validation.errors.map((error, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-destructive" />
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedProperty(property);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar Dados
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline"
                onClick={handlePreviewXML}
                disabled={isGenerating || properties.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview XML
              </Button>
              <Button 
                onClick={handleGenerateXML}
                disabled={isGenerating || properties.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar XML para Download
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Modal de edição */}
      {selectedProperty && (
        <OlxPublicationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProperty(null);
          }}
          property={selectedProperty}
          onSave={handleSaveOlxData}
        />
      )}

      {/* Modal de preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do XML - OLX</DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap font-mono">
            {xmlPreview}
          </pre>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
