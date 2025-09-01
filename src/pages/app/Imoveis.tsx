import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building2, Plus, Search, Filter, MapPin, Bath, Bed, Car, Edit, Trash2, Home, Upload, Eye, Globe, FileImage, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { FavoritesManager } from '@/components/FavoritesManager';
import { ShareButton } from '@/components/ShareButton';
import { formatCurrency, parseValueInput } from '@/lib/utils';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms: number;
  parking_spots: number;
  listing_type: string;
  property_type: string;
  visibility: string;
  descricao: string;
  fotos: string[];
  videos: string[];
  created_at: string;
  reference_code?: string;
}

export default function Imoveis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
    area: '',
    quartos: '',
    bathrooms: '',
    parking_spots: '',
    listing_type: 'venda',
    property_type: 'apartamento',
    visibility: 'public_site',
    broker_minisite_enabled: false,
    descricao: '',
    fotos: '',
    videos: '',
    address: '',
    neighborhood: '',
    city: '',
    condominium_fee: '',
    iptu: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('conectaios_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our interface
      const mappedData = (data || []).map(prop => ({
        id: prop.id,
        titulo: prop.titulo,
        valor: prop.valor,
        area: prop.area,
        quartos: prop.quartos,
        bathrooms: prop.bathrooms || 0,
        parking_spots: prop.parking_spots || 0,
        listing_type: prop.listing_type || 'venda',
        property_type: prop.property_type || 'apartamento',
        visibility: prop.visibility || 'public_site',
        descricao: prop.descricao,
        fotos: prop.fotos || [],
        videos: prop.videos || [],
        created_at: prop.created_at,
        reference_code: prop.reference_code
      }));
      
      setProperties(mappedData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imóveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para adicionar imóveis",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use existing parseValueInput from utils
      const parseValue = parseValueInput;

      // Handle photos from both upload and URLs
      let photosArray: string[] = [];
      
      // First add URLs if provided
      if (formData.fotos) {
        photosArray = formData.fotos.split(',').map(f => f.trim()).filter(f => f);
      }
      
      // TODO: Upload files to storage and add URLs to array
      // For now, we'll just use the URL inputs
      
      const propertyData = {
        user_id: user.id,
        titulo: formData.titulo,
        valor: parseValue(formData.valor),
        area: parseFloat(formData.area) || 0,
        quartos: parseInt(formData.quartos) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        parking_spots: parseInt(formData.parking_spots) || 0,
        listing_type: formData.listing_type,
        property_type: formData.property_type,
        visibility: formData.visibility,
        broker_minisite_enabled: formData.broker_minisite_enabled,
        descricao: formData.descricao,
        fotos: photosArray,
        videos: formData.videos ? formData.videos.split(',').map(v => v.trim()).filter(v => v) : [],
        address: formData.address,
        neighborhood: formData.neighborhood,
        city: formData.city,
        condominium_fee: formData.condominium_fee ? parseValue(formData.condominium_fee) : null,
        iptu: formData.iptu ? parseValue(formData.iptu) : null
      };

      let error;
      
      if (selectedProperty) {
        // Editar imóvel existente
        const { error: updateError } = await supabase
          .from('conectaios_properties')
          .update(propertyData)
          .eq('id', selectedProperty.id);
        error = updateError;
      } else {
        // Adicionar novo imóvel
        const { error: insertError } = await supabase
          .from('conectaios_properties')
          .insert(propertyData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: selectedProperty ? "Imóvel atualizado com sucesso!" : "Imóvel adicionado com sucesso!",
      });

      setIsAddDialogOpen(false);
      setSelectedProperty(null);
      setFormData({
        titulo: '',
        valor: '',
        area: '',
        quartos: '',
        bathrooms: '',
        parking_spots: '',
        listing_type: 'venda',
        property_type: 'apartamento',
        visibility: 'public_site',
        broker_minisite_enabled: false,
        descricao: '',
        fotos: '',
        videos: '',
        address: '',
        neighborhood: '',
        city: '',
        condominium_fee: '',
        iptu: ''
      });
      fetchProperties();
    } catch (error) {
      console.error('Error adding/updating property:', error);
      toast({
        title: "Erro",
        description: selectedProperty ? "Erro ao atualizar imóvel" : "Erro ao adicionar imóvel",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conectaios_properties' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imóvel excluído com sucesso!",
      });
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir imóvel",
        variant: "destructive",
      });
    }
  };

  const updatePropertyVisibility = async (id: string, visibility: string) => {
    try {
      const { error } = await supabase
        .from('conectaios_properties' as any)
        .update({ visibility })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setProperties(prev => prev.map(prop => 
        prop.id === id ? { ...prop, visibility } : prop
      ));

      toast({
        title: "Visibilidade atualizada",
        description: `Imóvel agora está configurado como: ${
          visibility === 'public_site' ? 'Marketplace' :
          visibility === 'match_only' ? 'Apenas Match' : 'Oculto'
        }`,
      });
    } catch (error) {
      console.error('Error updating property visibility:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar visibilidade",
        variant: "destructive",
      });
    }
  };

  const filteredProperties = properties.filter(property =>
    property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Imóveis
            </h1>
            <p className="text-muted-foreground">
              Gerencie seu portfólio de imóveis
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imóvel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProperty ? 'Editar Imóvel' : 'Adicionar Novo Imóvel'}</DialogTitle>
              <DialogDescription>
                {selectedProperty ? 'Atualize as informações do imóvel' : 'Preencha as informações do imóvel'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Apartamento 2 quartos Jardins"
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => {
                      // Remove caracteres inválidos e aplica formatação
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      setFormData({...formData, valor: value});
                    }}
                    placeholder="650.000,00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use formato brasileiro: 650.000,00
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label htmlFor="quartos">Quartos</Label>
                  <Input
                    id="quartos"
                    type="number"
                    value={formData.quartos}
                    onChange={(e) => setFormData({...formData, quartos: e.target.value})}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="listing_type">Finalidade</Label>
                  <Select value={formData.listing_type} onValueChange={(value) => setFormData({...formData, listing_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                      <SelectItem value="temporada">Temporada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição detalhada do imóvel..."
                />
              </div>

              <div>
                <Label htmlFor="fotos">Fotos do Imóvel</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setUploadedImages(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-2">Clique para selecionar fotos</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG até 10MB cada</p>
                  </label>
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium">{uploadedImages.length} foto(s) selecionada(s)</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {uploadedImages.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 bg-muted rounded p-2">
                            <FileImage className="h-4 w-4" />
                            <span className="text-xs truncate max-w-20">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <Label htmlFor="fotos-url">Ou URLs das Fotos (separadas por vírgula)</Label>
                  <Textarea
                    id="fotos-url"
                    value={formData.fotos}
                    onChange={(e) => setFormData({...formData, fotos: e.target.value})}
                    placeholder="https://exemplo.com/foto1.jpg, https://exemplo.com/foto2.jpg"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="videos">URLs dos Vídeos (separadas por vírgula)</Label>
                <Textarea
                  id="videos"
                  value={formData.videos}
                  onChange={(e) => setFormData({...formData, videos: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..., https://vimeo.com/..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="marketplace"
                    checked={formData.visibility === 'public_site'}
                    onCheckedChange={(checked) => setFormData({...formData, visibility: checked ? 'public_site' : 'hidden'})}
                  />
                  <Label htmlFor="marketplace">Mostrar no Marketplace</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="minisite"
                    checked={formData.broker_minisite_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, broker_minisite_enabled: checked})}
                  />
                  <Label htmlFor="minisite">Mostrar no Meu Site</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedProperty(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAddProperty}>
                {selectedProperty ? 'Salvar Alterações' : 'Adicionar Imóvel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted relative">
              {property.fotos && Array.isArray(property.fotos) && property.fotos.length > 0 && 
               property.fotos[0] && property.fotos[0].toString().trim() !== '' ? (
                <img
                  src={property.fotos[0].toString()}
                  alt={property.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.photo-fallback') as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              <div className={`photo-fallback w-full h-full flex items-center justify-center ${
                property.fotos && Array.isArray(property.fotos) && property.fotos.length > 0 && 
                property.fotos[0] && property.fotos[0].toString().trim() !== '' ? 'hidden' : ''
              }`}>
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <Badge className="bg-primary/90 text-primary-foreground">
                  {property.listing_type === 'venda' ? 'Venda' : 'Locação'}
                </Badge>
                {property.visibility === 'public_site' && (
                  <Badge variant="secondary">Público</Badge>
                )}
              </div>
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{property.titulo}</CardTitle>
                  <CardDescription>
                    {property.descricao && property.descricao.substring(0, 100)}...
                  </CardDescription>
                </div>
                {property.reference_code && (
                  <Badge variant="outline" className="text-xs">
                    {property.reference_code}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(parseFloat(property.valor?.toString() || '0'))}
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {property.area}m²
                </div>
                <div className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {property.quartos}
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  {property.bathrooms}
                </div>
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {property.parking_spots}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">{property.property_type}</Badge>
                  {property.visibility === 'public_site' ? (
                    <Badge variant="default" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Marketplace
                    </Badge>
                  ) : property.visibility === 'match_only' ? (
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Match
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Oculto
                    </Badge>
                  )}
                </div>
                <div className="text-right space-y-2">
                  {property.reference_code && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {property.reference_code}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedProperty(property);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Preenche o formulário com os dados do imóvel selecionado
                        setFormData({
                          titulo: property.titulo,
                          valor: property.valor.toString(),
                          area: property.area.toString(),
                          quartos: property.quartos.toString(),
                          bathrooms: property.bathrooms.toString(),
                          parking_spots: property.parking_spots.toString(),
                          listing_type: property.listing_type,
                          property_type: property.property_type,
                          visibility: property.visibility,
                          broker_minisite_enabled: false, // Assume false por padrão
                          descricao: property.descricao || '',
                          fotos: property.fotos.join(', '),
                          videos: property.videos.join(', '),
                          address: '',
                          neighborhood: '',
                          city: '',
                          condominium_fee: '',
                          iptu: ''
                        });
                        setSelectedProperty(property);
                        setIsAddDialogOpen(true); // Reutiliza o dialog de adicionar para edição
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Visibility Toggle Buttons */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={property.visibility === 'private' ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePropertyVisibility(property.id, 'private');
                      }}
                      title="Ocultar"
                    >
                      <EyeOff className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={property.visibility === 'match_only' ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePropertyVisibility(property.id, 'match_only');
                      }}
                      title="Apenas Match"
                    >
                      <Globe className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={property.visibility === 'public_site' ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePropertyVisibility(property.id, 'public_site');
                      }}
                      title="Site Público"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-muted-foreground">
            Adicione seu primeiro imóvel para começar
          </p>
        </div>
      )}

      {/* Property Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.titulo}</DialogTitle>
            <DialogDescription>
              Detalhes completos do imóvel
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-6">
              {/* Image Gallery */}
              <div className="grid grid-cols-2 gap-4">
                {selectedProperty.fotos?.map((foto, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={foto} 
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {/* Property Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Informações Básicas</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-semibold">{formatCurrency(selectedProperty.valor || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Área:</span>
                        <span>{selectedProperty.area}m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quartos:</span>
                        <span>{selectedProperty.quartos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Banheiros:</span>
                        <span>{selectedProperty.bathrooms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Garagem:</span>
                        <span>{selectedProperty.parking_spots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span>{selectedProperty.listing_type === 'venda' ? 'Venda' : selectedProperty.listing_type === 'locacao' ? 'Locação' : 'Temporada'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Tipo de Imóvel</h3>
                    <Badge variant="outline">{selectedProperty.property_type}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Ações</h3>
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Imóvel
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="destructive"
                        onClick={() => {
                          handleDeleteProperty(selectedProperty.id);
                          setIsDetailDialogOpen(false);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Imóvel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedProperty.descricao && (
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{selectedProperty.descricao}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}