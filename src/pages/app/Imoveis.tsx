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
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Building2, Plus, Search, Filter, MapPin, Bath, Bed, Car, Edit, Trash2, Home, Upload, Eye, Globe, FileImage, EyeOff, Wand2, Sparkles, Volume2, Droplet, Palette, Target } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { FavoritesManager } from '@/components/FavoritesManager';
import { ShareButton } from '@/components/ShareButton';
import { formatCurrency, parseValueInput } from '@/lib/utils';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoOrderManager } from '@/components/PhotoOrderManager';
import { WatermarkGenerator } from '@/components/WatermarkGenerator';
import { WatermarkManager } from '@/components/WatermarkManager';
import { PropertyBanner } from '@/components/PropertyBanner';
import { PhotoEnhancer } from '@/components/PhotoEnhancer';
import { FurnitureDetector } from '@/components/FurnitureDetector';
import { PhotoGallery } from '@/components/PhotoGallery';
import { VirtualStaging } from '@/components/VirtualStaging';
import { CommissionCalculator } from '@/components/CommissionCalculator';
import { AIPropertyDescription } from '@/components/AIPropertyDescription';
import XMLImportExport from '@/components/XMLImportExport';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';

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
  address?: string;
  neighborhood?: string;
  city?: string;
  reference_code?: string;
  banner_type?: string | null;
  is_furnished?: boolean;
  has_sea_view?: boolean;
  watermark_enabled?: boolean;
}

export default function Imoveis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [virtualStagingProperty, setVirtualStagingProperty] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [aiDescriptionProperty, setAiDescriptionProperty] = useState<Property | null>(null);
  const [showAiDescription, setShowAiDescription] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [selectedPropertyForWatermark, setSelectedPropertyForWatermark] = useState<Property | null>(null);
  const { speak, stop, isSpeaking, isCurrentlySpeaking, currentSpeakingId } = useElevenLabsVoice();
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
    fotos: [] as string[],
    videos: '',
    address: '',
    neighborhood: '',
    city: '',
    condominium_fee: '',
    iptu: '',
    commission_percentage: 6,
    commission_value: 0,
    commission_split_type: '50/50',
    commission_buyer_split: 50,
    commission_seller_split: 50,
    banner_type: '',
    is_furnished: false,
    has_sea_view: false,
    watermark_enabled: true,
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('conectaios_properties')
        .select('*')
        .eq('user_id', user.id)
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
        address: prop.address,
        neighborhood: prop.neighborhood,
        city: prop.city,
        reference_code: prop.reference_code,
        banner_type: prop.banner_type || null,
        is_furnished: prop.is_furnished || false,
        has_sea_view: prop.has_sea_view || false,
        watermark_enabled: prop.watermark_enabled !== undefined ? prop.watermark_enabled : true,
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
      const parseValue = parseValueInput;
      let photosArray: string[] = [];
      
      if (selectedProperty && selectedProperty.fotos) {
        photosArray = Array.isArray(selectedProperty.fotos) ? selectedProperty.fotos : [];
      }
      
      if (Array.isArray(formData.fotos)) {
        photosArray = [...photosArray, ...formData.fotos];
      }
      
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
        fotos: Array.isArray(formData.fotos) ? formData.fotos : [],
        videos: formData.videos ? formData.videos.split(',').map(v => v.trim()).filter(v => v) : [],
        address: formData.address,
        neighborhood: formData.neighborhood,
        city: formData.city,
        condominium_fee: formData.condominium_fee ? parseValue(formData.condominium_fee) : null,
        iptu: formData.iptu ? parseValue(formData.iptu) : null,
        banner_type: formData.banner_type === "none" ? null : formData.banner_type,
        is_furnished: formData.is_furnished || false,
        has_sea_view: formData.has_sea_view || false,
        watermark_enabled: formData.watermark_enabled !== undefined ? formData.watermark_enabled : true,
      };

      let result;
      
      if (selectedProperty) {
        result = await supabase
          .from('conectaios_properties')
          .update(propertyData)
          .eq('id', selectedProperty.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('conectaios_properties')
          .insert(propertyData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

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
        fotos: [],
        videos: '',
        address: '',
        neighborhood: '',
        city: '',
        condominium_fee: '',
        iptu: '',
        commission_percentage: 6,
        commission_value: 0,
        commission_split_type: '50/50',
        commission_buyer_split: 50,
        commission_seller_split: 50,
        banner_type: '',
        is_furnished: false,
        has_sea_view: false,
        watermark_enabled: true,
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

  const updatePropertyVisibility = async (propertyId: string, visibility: string) => {
    try {
      const { error } = await supabase
        .from('conectaios_properties')
        .update({ visibility })
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(prev => 
        prev.map(prop => 
          prop.id === propertyId 
            ? { ...prop, visibility }
            : prop
        )
      );

      toast({
        title: "Visibilidade atualizada",
        description: "A visibilidade do imóvel foi alterada com sucesso.",
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar visibilidade do imóvel.",
        variant: "destructive",
      });
    }
  };

  const openPhotoGallery = (photos: string[], initialIndex: number = 0) => {
    setGalleryPhotos(photos);
    setGalleryInitialIndex(initialIndex);
    setGalleryOpen(true);
  };

  const filteredProperties = properties.filter(property =>
    property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
        <div className="flex items-center gap-4">
          <XMLImportExport />
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
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título do imóvel"
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="Valor do imóvel"
                  />
                </div>
                <div>
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Área do imóvel"
                  />
                </div>
                <div>
                  <Label htmlFor="quartos">Quartos</Label>
                  <Input
                    id="quartos"
                    value={formData.quartos}
                    onChange={(e) => setFormData({ ...formData, quartos: e.target.value })}
                    placeholder="Número de quartos"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="Número de banheiros"
                  />
                </div>
                <div>
                  <Label htmlFor="parking_spots">Vagas de garagem</Label>
                  <Input
                    id="parking_spots"
                    value={formData.parking_spots}
                    onChange={(e) => setFormData({ ...formData, parking_spots: e.target.value })}
                    placeholder="Número de vagas"
                  />
                </div>
                <div>
                  <Label htmlFor="listing_type">Tipo de listagem</Label>
                  <Select
                    value={formData.listing_type}
                    onValueChange={(value) => setFormData({ ...formData, listing_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="temporada">Temporada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="property_type">Tipo de imóvel</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="visibility">Visibilidade</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a visibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public_site">Público no site</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                      <SelectItem value="broker_only">Apenas corretores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.broker_minisite_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, broker_minisite_enabled: checked })}
                    id="broker_minisite_enabled"
                  />
                  <Label htmlFor="broker_minisite_enabled">Habilitar minisite do corretor</Label>
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do imóvel"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="fotos">Fotos</Label>
                  <PhotoUploader
                    photos={formData.fotos}
                    onPhotosChange={(photos) => setFormData({ ...formData, fotos: photos })}
                  />
                </div>
                <div>
                  <Label htmlFor="videos">Vídeos (URLs separados por vírgula)</Label>
                  <Textarea
                    id="videos"
                    value={formData.videos}
                    onChange={(e) => setFormData({ ...formData, videos: e.target.value })}
                    placeholder="URLs dos vídeos"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Endereço do imóvel"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="condominium_fee">Condomínio</Label>
                  <Input
                    id="condominium_fee"
                    value={formData.condominium_fee}
                    onChange={(e) => setFormData({ ...formData, condominium_fee: e.target.value })}
                    placeholder="Valor do condomínio"
                  />
                </div>
                <div>
                  <Label htmlFor="iptu">IPTU</Label>
                  <Input
                    id="iptu"
                    value={formData.iptu}
                    onChange={(e) => setFormData({ ...formData, iptu: e.target.value })}
                    placeholder="Valor do IPTU"
                  />
                </div>
                <div>
                  <Label htmlFor="banner_type">Tipo de banner</Label>
                  <Select
                    value={formData.banner_type}
                    onValueChange={(value) => setFormData({ ...formData, banner_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="destaque">Destaque</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="lancamento">Lançamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_furnished}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_furnished: checked })}
                    id="is_furnished"
                  />
                  <Label htmlFor="is_furnished">Mobiliado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.has_sea_view}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_sea_view: checked })}
                    id="has_sea_view"
                  />
                  <Label htmlFor="has_sea_view">Vista para o mar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.watermark_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, watermark_enabled: checked })}
                    id="watermark_enabled"
                  />
                  <Label htmlFor="watermark_enabled">Marca d'água ativada</Label>
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
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
        {paginatedProperties.map((property) => (
          <Card key={property.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Property Image */}
            <div className="relative h-48 bg-muted">
              {property.fotos && property.fotos.length > 0 ? (
                <img
                  src={property.fotos[0]}
                  alt={property.titulo}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => openPhotoGallery(property.fotos, 0)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Photo Count Badge */}
              {property.fotos && property.fotos.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm">
                  <FileImage className="h-3 w-3 inline mr-1" />
                  {property.fotos.length}
                </div>
              )}

              {/* Banner */}
              {property.banner_type && property.banner_type !== 'none' && (
                <div className="absolute top-2 left-2">
                  <PropertyBanner bannerType={property.banner_type} />
                </div>
              )}

              {/* Visibility Badge */}
              <div className="absolute bottom-2 left-2">
                {property.visibility === 'public_site' ? (
                  <Badge variant="secondary" className="bg-green-500/90 text-white">
                    <Globe className="h-3 w-3 mr-1" />
                    Público
                  </Badge>
                ) : property.visibility === 'private' ? (
                  <Badge variant="secondary" className="bg-red-500/90 text-white">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Privado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-blue-500/90 text-white">
                    <Eye className="h-3 w-3 mr-1" />
                    Corretores
                  </Badge>
                )}
              </div>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg leading-tight">{property.titulo}</CardTitle>
                {property.reference_code && (
                  <Badge variant="outline" className="text-xs">
                    {property.reference_code}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {property.descricao || 'Sem descrição'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Property Type and Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="capitalize">{property.property_type}</span>
                  {property.city && (
                    <>
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{property.city}</span>
                    </>
                  )}
                </div>

                {/* Property Details */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span>{property.quartos} quarto{property.quartos !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span>{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{property.parking_spots}</span>
                  </div>
                  {property.area > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {property.area}m²
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(property.valor)}
                </div>

                {/* Property Features */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {property.listing_type}
                  </Badge>
                  {property.is_furnished && (
                    <Badge variant="outline" className="text-xs">
                      Mobiliado
                    </Badge>
                  )}
                  {property.has_sea_view && (
                    <Badge variant="outline" className="text-xs text-blue-600">
                      Vista Mar
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>

            {/* Action Buttons */}
            <div className="p-4 border-t border-muted/20 space-y-2">
              {/* Primary Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAiDescriptionProperty(property);
                    setShowAiDescription(true);
                  }}
                  className="flex-1"
                >
                  <Wand2 className="h-4 w-4 mr-1" />
                  IA Descrição
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPropertyForWatermark(property);
                    setShowWatermark(true);
                  }}
                  className="flex-1"
                >
                  <Droplet className="h-4 w-4 mr-1" />
                  Marca d'água
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2">
                <ShareButton
                  propertyId={property.id}
                  propertyTitle={property.titulo}
                  ownerUserId={user?.id}
                  isOwner={true}
                  isAuthorized={true}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (property.fotos && property.fotos.length > 0) {
                      setVirtualStagingProperty(property.fotos[0]);
                    } else {
                      toast({
                        title: "Erro",
                        description: "Adicione pelo menos uma foto para usar Virtual Staging",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!property.fotos || property.fotos.length === 0}
                >
                  <Palette className="h-4 w-4 mr-1" />
                  Virtual
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (property.descricao) {
                      const speechId = `property-${property.id}`;
                      if (isCurrentlySpeaking(speechId)) {
                        stop();
                      } else {
                        speak(property.descricao, speechId);
                      }
                    }
                  }}
                  className={isCurrentlySpeaking(`property-${property.id}`) ? "bg-primary/10" : ""}
                >
                  <Volume2 className={`h-4 w-4 mr-1 ${isCurrentlySpeaking(`property-${property.id}`) ? "text-primary animate-pulse" : ""}`} />
                  {isCurrentlySpeaking(`property-${property.id}`) ? "Pausar" : "Ouvir"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/marketplace/property/${property.id}`)}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Match
                </Button>
              </div>

              {/* Management Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProperty(property);
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
                      broker_minisite_enabled: false,
                      descricao: property.descricao,
                      fotos: property.fotos,
                      videos: property.videos.join(', '),
                      address: property.address || '',
                      neighborhood: property.neighborhood || '',
                      city: property.city || '',
                      condominium_fee: '',
                      iptu: '',
                      commission_percentage: 6,
                      commission_value: 0,
                      commission_split_type: '50/50',
                      commission_buyer_split: 50,
                      commission_seller_split: 50,
                      banner_type: property.banner_type || '',
                      is_furnished: property.is_furnished || false,
                      has_sea_view: property.has_sea_view || false,
                      watermark_enabled: property.watermark_enabled !== undefined ? property.watermark_enabled : true,
                    });
                    setIsAddDialogOpen(true);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newVisibility = property.visibility === 'public_site' ? 'private' : 'public_site';
                    updatePropertyVisibility(property.id, newVisibility);
                  }}
                  className="flex-1"
                >
                  {property.visibility === 'public_site' ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Publicar
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteProperty(property.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Photo Gallery */}
      <PhotoGallery
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      {/* AI Property Description Dialog */}
      <Dialog open={showAiDescription} onOpenChange={setShowAiDescription}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerar Descrição com IA</DialogTitle>
            <DialogDescription>
              Use inteligência artificial para criar uma descrição atrativa para seu imóvel
            </DialogDescription>
          </DialogHeader>
          {aiDescriptionProperty && (
            <AIPropertyDescription
              property={aiDescriptionProperty}
              onDescriptionGenerated={(description) => {
                setSelectedProperty(aiDescriptionProperty);
                setFormData(prev => ({ ...prev, descricao: description }));
                setShowAiDescription(false);
                setIsAddDialogOpen(true);
              }}
              onClose={() => setShowAiDescription(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Watermark Manager Dialog */}
      <Dialog open={showWatermark} onOpenChange={setShowWatermark}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Marca d'água</DialogTitle>
            <DialogDescription>
              Aplique marca d'água nas fotos do imóvel para proteção
            </DialogDescription>
          </DialogHeader>
          {selectedPropertyForWatermark && (
            <WatermarkManager
              images={selectedPropertyForWatermark.fotos}
              onWatermarkedImages={(watermarkedImages) => {
                // Update property with watermarked images
                const newPhotos = watermarkedImages.map(img => img.watermarked);
                setSelectedProperty(selectedPropertyForWatermark);
                setFormData(prev => ({ ...prev, fotos: newPhotos }));
                setShowWatermark(false);
                setIsAddDialogOpen(true);
              }}
              defaultWatermarkText="ConectAIOS"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Virtual Staging */}
      {virtualStagingProperty && (
        <Dialog open={!!virtualStagingProperty} onOpenChange={() => setVirtualStagingProperty(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Virtual Staging</DialogTitle>
              <DialogDescription>
                Transforme ambientes vazios em espaços mobiliados usando IA
              </DialogDescription>
            </DialogHeader>
            <VirtualStaging
              imageUrl={virtualStagingProperty}
              onStagedImage={(processedUrl) => {
                toast({
                  title: "Sucesso",
                  description: "Imagem processada com staging virtual!",
                });
                setVirtualStagingProperty(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
