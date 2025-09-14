import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Search, Filter, MapPin, Bath, Bed, Car, Edit, Trash2, Home, Upload, Eye, Globe, FileImage, EyeOff, Wand2, Sparkles, Volume2, Droplet, Palette, Target, Zap } from 'lucide-react';
import { EnvioFlash } from '@/components/EnvioFlash';
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
import { PropertyIcons } from '@/components/PropertyIcons';
import { ConectaIOSImageProcessor } from '@/components/ConectaIOSImageProcessor';

import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { PropertyListSkeleton } from '@/components/ui/skeleton-property-card';

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
  banner_type?: string | null;
  is_furnished?: boolean;
  has_sea_view?: boolean;
  watermark_enabled?: boolean;
  furnishing_type?: 'none' | 'furnished' | 'semi_furnished';
  sea_distance?: number;
}

export default function Imoveis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
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
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);
  const [processorType, setProcessorType] = useState<'enhance' | 'staging'>('enhance');
  const [isEnvioFlashModalOpen, setIsEnvioFlashModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('lista');
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
    commission_percentage: 5,
    commission_value: 0,
    commission_split_type: '50/50',
    commission_buyer_split: 50,
    commission_seller_split: 50,
    banner_type: null,
    is_furnished: false,
    has_sea_view: false,
    watermark_enabled: true,
    furnishing_type: 'none' as 'none' | 'furnished' | 'semi_furnished',
    sea_distance: '',
  });

  const fetchProperties = useCallback(async (page = 1, pageSize = 20) => {
    try {
      setIsLoading(true);
      
      const startIndex = (page - 1) * pageSize;
      
      // Optimized query selecting only needed fields
      const { data, error, count } = await supabase
        .from('conectaios_properties')
        .select(`
          id,
          titulo,
          valor,
          area,
          quartos,
          bathrooms,
          parking_spots,
          listing_type,
          property_type,
          visibility,
          descricao,
          fotos,
          videos,
          created_at,
          reference_code,
          furnishing_type,
          sea_distance
        `, { count: 'exact' })
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + pageSize - 1);

      if (error) {
        throw error;
      }
      
      // Optimized mapping with memoization
      const mappedData = (data || []).map(prop => ({
        ...prop,
        bathrooms: prop.bathrooms || 0,
        parking_spots: prop.parking_spots || 0,
        listing_type: prop.listing_type || 'venda',
        property_type: prop.property_type || 'apartamento',
        visibility: prop.visibility || 'public_site',
        fotos: prop.fotos || [],
        videos: prop.videos || [],
        banner_type: null,
        is_furnished: prop.furnishing_type === 'furnished',
        has_sea_view: prop.sea_distance && prop.sea_distance <= 500,
        watermark_enabled: true,
        furnishing_type: (prop.furnishing_type as 'none' | 'furnished' | 'semi_furnished') || 'none',
      }));
      
      setProperties(mappedData);
      
      if (count !== null) {
        setPagination(prev => ({
          ...prev,
          totalItems: count,
          totalPages: Math.ceil(count / pageSize),
          currentPage: page
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao buscar imóveis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imóveis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchProperties(1); // Start with page 1
    }
  }, [user?.id, fetchProperties]);

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
      console.log('=== DEBUGGING PROPERTY SAVE ===');
      console.log('FormData.fotos:', formData.fotos);
      console.log('FormData.fotos type:', typeof formData.fotos);
      console.log('FormData.fotos length:', Array.isArray(formData.fotos) ? formData.fotos.length : 'not array');
      console.log('Raw value input:', formData.valor);
      console.log('Parsed value:', parseValueInput(formData.valor));
      
      // Use existing parseValueInput from utils
      const parseValue = parseValueInput;

      // Handle photos from both upload and URLs
      let photosArray: string[] = [];
      
      // If editing, start with existing photos
      if (selectedProperty && selectedProperty.fotos) {
        photosArray = Array.isArray(selectedProperty.fotos) ? selectedProperty.fotos : [];
      }
      
      // Add new photos from form data
      if (Array.isArray(formData.fotos)) {
        photosArray = [...photosArray, ...formData.fotos];
      }
      
      console.log('Final photos array:', photosArray);
      console.log('Photos array length:', photosArray.length);
      
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
        banner_type: (formData.banner_type === "none" || formData.banner_type === "" || !formData.banner_type) ? null : formData.banner_type,
        furnishing_type: formData.furnishing_type,
        sea_distance: formData.sea_distance ? parseInt(formData.sea_distance) : null,
      };

      console.log('Final property data to save:', propertyData);
      console.log('Property data fotos field:', propertyData.fotos);

      let result;
      
      if (selectedProperty) {
        // Editar imóvel existente
        result = await supabase
          .from('conectaios_properties')
          .update(propertyData)
          .eq('id', selectedProperty.id)
          .select()
          .single();
      } else {
        // Adicionar novo imóvel - gera código automaticamente no banco via trigger
        result = await supabase
          .from('conectaios_properties')
          .insert(propertyData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving property:', result.error);
        throw result.error;
      }

      console.log('Property saved successfully:', result.data);
      console.log('Saved photos in database:', result.data.fotos);

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
        banner_type: null,
        is_furnished: false,
        has_sea_view: false,
        watermark_enabled: true,
        furnishing_type: 'none' as 'none' | 'furnished' | 'semi_furnished',
        sea_distance: '',
      });
      fetchProperties(1);
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
      fetchProperties(1);
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

      // Update local state
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

  const filteredProperties = useMemo(() => {
    return properties.filter(property =>
      property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [properties, searchTerm]);

  // Display all properties as pagination is handled on server-side
  const paginatedProperties = filteredProperties;

  // Reset to first page when search changes
  useEffect(() => {
    if (searchTerm) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchTerm]);

  // Function to handle extracted data from EnvioFlash
  const handleExtractedData = (extractedData: any) => {
    // Map extracted data to form fields
    const mappedData = {
      titulo: extractedData.titulo || '',
      valor: extractedData.preco ? extractedData.preco.toString() : '',
      area: extractedData.area_m2 ? extractedData.area_m2.toString() : '',
      quartos: extractedData.quartos ? extractedData.quartos.toString() : '',
      bathrooms: extractedData.banheiros ? extractedData.banheiros.toString() : '',
      parking_spots: extractedData.vagas ? extractedData.vagas.toString() : '',
      listing_type: extractedData.finalidade || 'venda',
      property_type: extractedData.tipo || 'apartamento',
      city: extractedData.cidade || '',
      uf: extractedData.uf || '',
      descricao: extractedData.descricao || '',
    };

    // Update form data
    setFormData(prev => ({ ...prev, ...mappedData }));
    
    // Open the add dialog and switch to form tab
    setIsAddDialogOpen(true);
    setActiveTab('lista');
    setIsEnvioFlashModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/2 animate-pulse"></div>
        <PropertyListSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 w-fit"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                Imóveis
              </h1>
              <p className="text-muted-foreground">
                Gerencie seu portfólio de imóveis
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90 h-11">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Imóvel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{selectedProperty ? 'Editar Imóvel' : 'Adicionar Novo Imóvel'}</DialogTitle>
                  <DialogDescription>
                    {selectedProperty ? 'Atualize as informações do imóvel' : 'Preencha as informações do imóvel'}
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEnvioFlashModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Envio Flash
                </Button>
              </div>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Apartamento 2 quartos Jardins"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    placeholder="650.000,00"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use formato brasileiro: 650.000,00
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="120"
                    className="h-11"
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
                    className="h-11"
                  />
                 </div>
                 <div>
                   <Label htmlFor="bathrooms">Banheiros</Label>
                   <Input
                     id="bathrooms"
                     type="number"
                     value={formData.bathrooms}
                     onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                     placeholder="2"
                     className="h-11"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                   <Label htmlFor="parking_spots">Vagas</Label>
                   <Input
                     id="parking_spots"
                     type="number"
                     value={formData.parking_spots}
                     onChange={(e) => setFormData({...formData, parking_spots: e.target.value})}
                     placeholder="1"
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
                 <div>
                   <Label htmlFor="property_type">Tipo</Label>
                   <Select value={formData.property_type} onValueChange={(value) => setFormData({...formData, property_type: value})}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="apartamento">Apartamento</SelectItem>
                       <SelectItem value="casa">Casa</SelectItem>
                       <SelectItem value="sobrado">Sobrado</SelectItem>
                       <SelectItem value="terreno">Terreno</SelectItem>
                       <SelectItem value="comercial">Comercial</SelectItem>
                       <SelectItem value="chacara">Chácara</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="banner_type">Banner</Label>
                    <Select value={formData.banner_type} onValueChange={(value) => setFormData({...formData, banner_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um banner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="vendido">Vendido</SelectItem>
                        <SelectItem value="alugado">Alugado</SelectItem>
                        <SelectItem value="oportunidade">Oportunidade</SelectItem>
                        <SelectItem value="exclusivo">Exclusivo</SelectItem>
                        <SelectItem value="abaixo_mercado">Abaixo do Mercado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="furnishing_type">Mobília</Label>
                    <Select value={formData.furnishing_type} onValueChange={(value: 'none' | 'furnished' | 'semi_furnished') => setFormData({...formData, furnishing_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não Mobiliado</SelectItem>
                        <SelectItem value="furnished">Mobiliado</SelectItem>
                        <SelectItem value="semi_furnished">Semi-mobiliado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sea_distance">Distância do Mar (metros)</Label>
                    <Input
                      id="sea_distance"
                      type="number"
                      value={formData.sea_distance}
                      onChange={(e) => setFormData({...formData, sea_distance: e.target.value})}
                      placeholder="500"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe vazio se não aplicável
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_sea_view"
                        checked={formData.has_sea_view}
                        onCheckedChange={(checked) => setFormData({...formData, has_sea_view: checked})}
                      />
                      <Label htmlFor="has_sea_view">Vista Mar</Label>
                    </div>
                  </div>
                </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAiDescription(true)}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar com IA
                  </Button>
                </div>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição detalhada do imóvel..."
                />
              </div>

              <PhotoUploader 
                photos={Array.isArray(formData.fotos) ? formData.fotos : []}
                onPhotosChange={(photos) => {
                  console.log('PhotoUploader onPhotosChange called with:', photos);
                  console.log('Photos type:', typeof photos);
                  console.log('Photos length:', Array.isArray(photos) ? photos.length : 'not array');
                  setFormData({...formData, fotos: photos});
                }}
                watermarkEnabled={formData.watermark_enabled}
                onWatermarkEnabledChange={(enabled) => {
                  setFormData({...formData, watermark_enabled: enabled});
                }}
                watermarkText="ConectaIOS"
              />
              
              {/* Photo Order Manager */}
              {Array.isArray(formData.fotos) && formData.fotos.length > 1 && (
                <div className="border-t pt-4">
                  <PhotoOrderManager
                    photos={formData.fotos}
                    onPhotosReorder={(reorderedPhotos) => {
                      setFormData({...formData, fotos: reorderedPhotos});
                    }}
                    onCoverPhotoSelect={(coverIndex) => {
                      // Move selected photo to first position
                      const newPhotos = [...formData.fotos];
                      const [coverPhoto] = newPhotos.splice(coverIndex, 1);
                      newPhotos.unshift(coverPhoto);
                      setFormData({...formData, fotos: newPhotos});
                    }}
                    coverPhotoIndex={0}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="videos">URLs dos Vídeos (separadas por vírgula)</Label>
                <Textarea
                  id="videos"
                  value={formData.videos}
                  onChange={(e) => setFormData({...formData, videos: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..., https://vimeo.com/..."
                />
              </div>

              {/* Commission Calculator */}
              {formData.valor && parseValueInput(formData.valor) > 0 && (
                <div className="border-t pt-4">
                  <CommissionCalculator
                    propertyValue={parseValueInput(formData.valor)}
                    businessType={formData.listing_type}
                    onCommissionChange={(commission) => {
                      setFormData({
                        ...formData,
                        commission_percentage: commission.percentage,
                        commission_value: commission.value,
                        commission_split_type: commission.splitType,
                        commission_buyer_split: commission.buyerSplit,
                        commission_seller_split: commission.sellerSplit
                      });
                    }}
                    initialCommission={{
                      percentage: formData.commission_percentage,
                      splitType: formData.commission_split_type,
                      buyerSplit: formData.commission_buyer_split,
                      sellerSplit: formData.commission_seller_split
                    }}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label>Visibilidade do Imóvel</Label>
                  <Select value={formData.visibility} onValueChange={(value) => setFormData({...formData, visibility: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione onde mostrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public_site">Site Público</SelectItem>
                      <SelectItem value="match_only">Apenas Marketplace</SelectItem>
                      <SelectItem value="both">Site e Marketplace</SelectItem>
                      <SelectItem value="hidden">Oculto</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button 
                onClick={handleAddProperty}
                className="bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 hover:ring-2 hover:ring-primary/20 hover:ring-offset-2"
              >
                {selectedProperty ? 'Salvar Alterações' : 'Adicionar Imóvel'}
              </Button>
             </div>
           </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filters wrapped in Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Lista de Imóveis
          </TabsTrigger>
          <TabsTrigger value="envio-flash" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Envio Flash
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="space-y-6">
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
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted relative">
              {/* Property Banner */}
              <PropertyBanner bannerType={property.banner_type} />
              
              {(() => {
                const photosArray = Array.isArray(property.fotos) ? property.fotos : [];
                const hasValidPhoto = photosArray.length > 0 && photosArray[0];
                
                return (
                  <div 
                    className="w-full h-full cursor-pointer"
                    onClick={() => photosArray.length > 0 && openPhotoGallery(photosArray, 0)}
                  >
                    {hasValidPhoto ? (
                      <img
                        src={String(photosArray[0])}
                        alt={property.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {photosArray.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        +{photosArray.length - 1} fotos
                      </div>
                    )}
                    
                    {property.fotos.some(photo => photo.includes('enhanced=')) && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          IA
                        </Badge>
                      </div>
                    )}
                    
                    {/* Property Features */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {property.is_furnished && (
                        <Badge variant="secondary" className="text-xs">Mobiliado</Badge>
                      )}
                      {property.has_sea_view && (
                        <Badge variant="secondary" className="text-xs">Vista Mar</Badge>
                      )}
                    </div>
                  </div>
                );
              })()}
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
                {formatCurrency(Number(property.valor) || 0)}
              </div>
              
               {/* All property icons in one line */}
               <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
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
                 
                 {/* Additional property features inline */}
                 <PropertyIcons 
                   furnishing_type={property.furnishing_type as 'none' | 'furnished' | 'semi_furnished'}
                   sea_distance={property.sea_distance}
                   has_sea_view={property.has_sea_view}
                   className=""
                 />
               </div>

               <div className="flex justify-between items-start">
                 <div className="space-y-2">
                   <Badge variant="outline" className="text-xs">{property.property_type}</Badge>
                    {property.visibility === 'public_site' ? (
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Site Público
                      </Badge>
                    ) : property.visibility === 'match_only' ? (
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Marketplace
                      </Badge>
                    ) : property.visibility === 'both' ? (
                      <Badge variant="default" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Site + Market
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
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
                  </div>
                </div>
                
                 {/* Action Buttons Grid - 2 columns for top buttons */}
                 <div className="space-y-3 mt-4">
                   <div className="grid grid-cols-2 gap-2">
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => {
                         setSelectedProperty(property);
                         setIsDetailDialogOpen(true);
                       }}
                       title="Visualizar Imóvel"
                       className="h-8 text-xs"
                     >
                       <Eye className="h-3 w-3 mr-1" />
                       Ver
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => {
                         setGalleryPhotos(Array.isArray(property.fotos) ? property.fotos : []);
                         setGalleryInitialIndex(0);
                         setGalleryOpen(true);
                       }}
                       title="Editar Fotos"
                       className="h-8 text-xs"
                     >
                       <FileImage className="h-3 w-3 mr-1" />
                       Fotos
                     </Button>
                   </div>
                   
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setAiDescriptionProperty(property);
                          setShowAiDescription(true);
                        }}
                        title="Gerar Descrição com IA"
                        className="h-8 text-xs"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        IA Desc
                      </Button>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => {
                           if (property.fotos && property.fotos.length > 0) {
                             setSelectedProperty(property);
                             setProcessorType('staging');
                             setIsProcessorOpen(true);
                           } else {
                             toast({
                               title: "Sem Fotos",
                               description: "Adicione fotos ao imóvel primeiro",
                               variant: "destructive",
                             });
                           }
                         }}
                         title="Colocar Móveis"
                         className="h-8 text-xs"
                       >
                         <Wand2 className="h-3 w-3 mr-1" />
                         Móveis
                       </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => {
                           if (property.fotos && property.fotos.length > 0) {
                             setSelectedProperty(property);
                             setProcessorType('enhance');
                             setIsProcessorOpen(true);
                           } else {
                             toast({
                               title: "Sem Fotos",
                               description: "Adicione fotos ao imóvel primeiro",
                               variant: "destructive",
                             });
                           }
                         }}
                         title="Melhorar Qualidade"
                         className="h-8 text-xs"
                       >
                         <Sparkles className="h-3 w-3 mr-1" />
                         Qualidade
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => {
                           // Open evaluation tool for the property
                           window.open(`https://simuladororquidario.gicarneiroimoveis.com.br/?area=${property.area}&quartos=${property.quartos}&tipo=${property.property_type}`, '_blank', 'noopener,noreferrer');
                         }}
                         title="Avaliar Imóvel"
                         className="h-8 text-xs"
                       >
                         <Target className="h-3 w-3 mr-1" />
                         Avaliar
                       </Button>
                    </div>
                   
                   <div className="grid grid-cols-2 gap-2">
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
                           broker_minisite_enabled: false,
                           descricao: property.descricao || '',
                           fotos: Array.isArray(property.fotos) ? property.fotos : [],
                           videos: Array.isArray(property.videos) ? property.videos.join(', ') : '',
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
                           banner_type: property.banner_type || null,
                           is_furnished: property.is_furnished || false,
                           has_sea_view: property.has_sea_view || false,
                            watermark_enabled: true,
                            furnishing_type: (property.furnishing_type as 'none' | 'furnished' | 'semi_furnished') || 'none',
                            sea_distance: property.sea_distance ? String(property.sea_distance) : '',
                         });
                         setSelectedProperty(property);
                         setIsAddDialogOpen(true); // Reutiliza o dialog de adicionar para edição
                       }}
                       title="Editar Imóvel"
                       className="h-8 text-xs"
                     >
                       <Edit className="h-3 w-3 mr-1" />
                       Editar
                     </Button>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => handleDeleteProperty(property.id)}
                       title="Excluir Imóvel"
                       className="h-8 hover:bg-destructive/10 text-xs"
                     >
                       <Trash2 className="h-3 w-3 mr-1" />
                       Excluir
                     </Button>
                   </div>

                    {/* Visibility Toggle Buttons - Simplified System */}
                    <div className="grid grid-cols-3 gap-2">
                       <Button
                         size="sm"
                         variant={property.visibility === 'marketplace' || property.visibility === 'both' ? 'default' : 'outline'}
                         onClick={(e) => {
                           e.stopPropagation();
                           // Toggle marketplace visibility
                           let newVisibility = property.visibility;
                           if (property.visibility === 'marketplace') {
                             newVisibility = 'hidden';
                           } else if (property.visibility === 'public_site') {
                             newVisibility = 'both';
                           } else if (property.visibility === 'both') {
                             newVisibility = 'public_site';
                           } else {
                             newVisibility = 'marketplace';
                           }
                           updatePropertyVisibility(property.id, newVisibility);
                         }}
                         title="Marketplace - Imóvel aparece no marketplace"
                         className="text-xs h-6 flex items-center justify-center"
                       >
                         <Target className="h-2 w-2 mr-1" />
                         Market
                       </Button>
                       <Button
                         size="sm"
                         variant={property.visibility === 'public_site' || property.visibility === 'both' ? 'default' : 'outline'}
                         onClick={(e) => {
                           e.stopPropagation();
                           // Toggle public site visibility
                           let newVisibility = property.visibility;
                           if (property.visibility === 'public_site') {
                             newVisibility = 'hidden';
                           } else if (property.visibility === 'marketplace') {
                             newVisibility = 'both';
                           } else if (property.visibility === 'both') {
                             newVisibility = 'marketplace';
                           } else {
                             newVisibility = 'public_site';
                           }
                           updatePropertyVisibility(property.id, newVisibility);
                         }}
                         title="Site Público - Imóvel aparece no site público e minisite"
                         className="text-xs h-6 flex items-center justify-center"
                       >
                         <Globe className="h-2 w-2 mr-1" />
                         Site
                       </Button>
                      <Button
                        size="sm"
                        variant={property.visibility === 'hidden' ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePropertyVisibility(property.id, 'hidden');
                        }}
                        title="Oculto - Visível apenas para você no painel"
                        className="text-xs h-6 flex items-center justify-center"
                      >
                        <EyeOff className="h-2 w-2 mr-1" />
                        Oculto
                      </Button>
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} imóveis
            </span>
            <Select value={pagination.itemsPerPage.toString()} onValueChange={(value) => {
              setPagination(prev => ({ ...prev, itemsPerPage: parseInt(value), currentPage: 1 }));
              fetchProperties(1, parseInt(value));
            }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="40">40 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Pagination>
            <PaginationContent className="flex-wrap gap-1">
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.currentPage > 1) {
                      const newPage = pagination.currentPage - 1;
                      setPagination(prev => ({ ...prev, currentPage: newPage }));
                      fetchProperties(newPage);
                    }
                  }}
                  className={`text-xs px-2 py-1 h-8 ${pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
              
              {[...Array(Math.min(3, pagination.totalPages))].map((_, i) => {
                let pageNum;
                if (pagination.totalPages <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 2) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 1) {
                  pageNum = pagination.totalPages - 2 + i;
                } else {
                  pageNum = pagination.currentPage - 1 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPagination(prev => ({ ...prev, currentPage: pageNum }));
                        fetchProperties(pageNum);
                      }}
                      isActive={pagination.currentPage === pageNum}
                      className="text-xs px-2 py-1 min-w-[32px] h-8"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.currentPage < pagination.totalPages) {
                      const newPage = pagination.currentPage + 1;
                      setPagination(prev => ({ ...prev, currentPage: newPage }));
                      fetchProperties(newPage);
                    }
                  }}
                  className={`text-xs px-2 py-1 h-8 ${pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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
                     <Button className="w-full" variant="outline" onClick={() => {
                         // Preenche o formulário com os dados do imóvel selecionado
                          setFormData({
                            titulo: selectedProperty.titulo,
                            valor: selectedProperty.valor.toString(),
                            area: selectedProperty.area.toString(),
                            quartos: selectedProperty.quartos.toString(),
                            bathrooms: selectedProperty.bathrooms.toString(),
                            parking_spots: selectedProperty.parking_spots.toString(),
                            listing_type: selectedProperty.listing_type,
                            property_type: selectedProperty.property_type,
                            visibility: selectedProperty.visibility,
                            broker_minisite_enabled: false,
                            descricao: selectedProperty.descricao || '',
                            fotos: Array.isArray(selectedProperty.fotos) ? selectedProperty.fotos : [],
                            videos: Array.isArray(selectedProperty.videos) ? selectedProperty.videos.join(', ') : '',
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
                            banner_type: selectedProperty.banner_type || null,
                            is_furnished: selectedProperty.is_furnished || false,
                            has_sea_view: selectedProperty.has_sea_view || false,
                            watermark_enabled: selectedProperty.watermark_enabled || false,
                            furnishing_type: (selectedProperty.furnishing_type as 'none' | 'furnished' | 'semi_furnished') || 'none',
                            sea_distance: selectedProperty.sea_distance ? String(selectedProperty.sea_distance) : '',
                          });
                         setIsDetailDialogOpen(false);
                         setIsAddDialogOpen(true);
                       }}>
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

      {/* Photo Gallery */}
      <PhotoGallery
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      {/* Virtual Staging Modal */}
      {virtualStagingProperty && (
        <Dialog open={!!virtualStagingProperty} onOpenChange={() => setVirtualStagingProperty(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Virtual Staging - {properties.find(p => p.id === virtualStagingProperty)?.titulo}</DialogTitle>
              <DialogDescription>
                Transforme fotos vazias em ambientes mobiliados usando IA
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const property = properties.find(p => p.id === virtualStagingProperty);
              const photos = Array.isArray(property?.fotos) ? property.fotos : [];
              
              return (
                <div className="space-y-6">
                  {photos.length > 0 ? (
                    <div className="grid gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Foto {index + 1}</h4>
                            <Badge variant="outline">
                              {photo.includes('?enhanced=true') ? 'Melhorada' : 'Original'}
                            </Badge>
                          </div>
                          <VirtualStaging
                            imageUrl={photo}
                            onStagedImage={(stagedUrl) => {
                              // Atualizar a propriedade adicionando a nova foto
                              const updatedPhotos = [...photos, stagedUrl];
                              const updatedProperty = { ...property, fotos: updatedPhotos };
                              
                              // Atualizar no estado local
                              setProperties(prev => prev.map(p => 
                                p.id === virtualStagingProperty ? updatedProperty : p
                              ));
                              
                              // Opcional: salvar no banco também
                              supabase
                                .from('conectaios_properties')
                                .update({ fotos: updatedPhotos })
                                .eq('id', virtualStagingProperty)
                                .then(() => {
                                  toast({
                                    title: "Virtual Staging Salvo!",
                                    description: "A versão mobiliada foi adicionada ao imóvel.",
                                  });
                                });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma foto disponível para Virtual Staging.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* AI Description Dialog */}
      {showAiDescription && (aiDescriptionProperty || formData.titulo) && (
        <Dialog open={showAiDescription} onOpenChange={setShowAiDescription}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <AIPropertyDescription
              property={aiDescriptionProperty || {
                id: selectedProperty?.id || '',
                titulo: formData.titulo,
                valor: parseValueInput(formData.valor),
                area: parseFloat(formData.area) || 0,
                quartos: parseInt(formData.quartos) || 0,
                bathrooms: parseInt(formData.bathrooms) || 0,
                parking_spots: parseInt(formData.parking_spots) || 0,
                listing_type: formData.listing_type,
                property_type: formData.property_type,
                descricao: formData.descricao,
                address: formData.address,
                neighborhood: formData.neighborhood,
                city: formData.city,
                condominium_fee: parseFloat(formData.condominium_fee) || 0,
                iptu: parseFloat(formData.iptu) || 0
              }}
              onDescriptionGenerated={(description) => {
                if (aiDescriptionProperty) {
                  // Atualizar a descrição do imóvel existente
                  const updatedProperty = { ...aiDescriptionProperty, descricao: description };
                  
                  // Atualizar no banco de dados
                  supabase
                    .from('conectaios_properties')
                    .update({ descricao: description })
                    .eq('id', aiDescriptionProperty.id)
                    .then(({ error }) => {
                      if (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível salvar a descrição.",
                          variant: "destructive",
                        });
                      } else {
                        // Atualizar estado local
                        setProperties(prev => prev.map(p => 
                          p.id === aiDescriptionProperty.id ? updatedProperty : p
                        ));
                        toast({
                          title: "Descrição salva!",
                          description: "A descrição foi atualizada no imóvel.",
                        });
                      }
                    });
                } else {
                  // Atualizar o formulário de criação
                  setFormData({...formData, descricao: description});
                }
              }}
              onClose={() => {
                setShowAiDescription(false);
                setAiDescriptionProperty(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <ConectaIOSImageProcessor
        isOpen={isProcessorOpen}
        onClose={() => setIsProcessorOpen(false)}
        onImageProcessed={async (imageUrl) => {
          if (selectedProperty) {
            try {
              console.log('Processing image URL:', imageUrl);
              
              let finalImageUrl = imageUrl;
              
              // Se a URL é um blob ou URL local, fazer upload para Supabase
              if (imageUrl.startsWith('blob:') || imageUrl.includes('conectaios') || imageUrl.startsWith('data:')) {
                console.log('Converting external URL to Supabase upload...');
                
                const response = await fetch(imageUrl);
                if (!response.ok) {
                  throw new Error('Failed to fetch processed image');
                }
                
                const blob = await response.blob();
                const fileName = `processed-${processorType}-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('property-images')
                  .upload(fileName, blob);
                
                if (uploadError) {
                  console.error('Upload error:', uploadError);
                  throw uploadError;
                }
                
                const { data: { publicUrl } } = supabase.storage
                  .from('property-images')
                  .getPublicUrl(uploadData.path);
                
                finalImageUrl = publicUrl;
                console.log('Image uploaded successfully:', finalImageUrl);
              }
              
              const updatedPhotos = [...(selectedProperty.fotos || []), finalImageUrl];
              
              const { error } = await supabase
                .from('conectaios_properties')
                .update({ fotos: updatedPhotos })
                .eq('id', selectedProperty.id);

              if (error) {
                console.error('Database update error:', error);
                throw error;
              }

              toast({
                title: "Sucesso!",
                description: processorType === 'enhance' 
                  ? "Imagem com qualidade melhorada adicionada!" 
                  : "Imagem com móveis adicionada!",
              });

              fetchProperties();
              setIsProcessorOpen(false);
            } catch (error) {
              console.error('Error updating property photos:', error);
              toast({
                title: "Erro",
                description: `Erro ao adicionar imagem processada: ${error.message}`,
                variant: "destructive",
              });
            }
          } else {
            console.error('No property selected');
            toast({
              title: "Erro",
              description: "Nenhuma propriedade selecionada",
              variant: "destructive",
            });
          }
        }}
        type={processorType}
        initialImage={selectedProperty?.fotos?.[0]}
      />
      
        </TabsContent>
        
        <TabsContent value="envio-flash" className="space-y-6">
          <EnvioFlash
            onDataExtracted={handleExtractedData}
          />
        </TabsContent>
      </Tabs>

      {/* EnvioFlash Modal */}
      <Dialog open={isEnvioFlashModalOpen} onOpenChange={setIsEnvioFlashModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envio Flash - Extração Automática</DialogTitle>
            <DialogDescription>
              Envie uma imagem do imóvel e deixe a IA extrair os dados automaticamente
            </DialogDescription>
          </DialogHeader>
          <EnvioFlash
            onDataExtracted={handleExtractedData}
            onClose={() => setIsEnvioFlashModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}