import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, Home, Eye, Globe, FileImage, EyeOff, Bath, Bed, Car, MapPin, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { ShareButton } from '@/components/ShareButton';
import { formatCurrency } from '@/lib/utils';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Tour360Modal } from '@/components/Tour360Modal';

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
  created_at: string;
  reference_code?: string;
  has_sea_view?: boolean;
  furnishing_type?: 'none' | 'furnished' | 'semi_furnished';
  sea_distance?: number;
  neighborhood?: string;
  address?: string;
  city?: string;
  state?: string;
}

export default function Imoveis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedProperties, setCollapsedProperties] = useState<Set<string>>(new Set());
  
  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Modal states
  const [isTour360ModalOpen, setIsTour360ModalOpen] = useState(false);
  const [tour360Property, setTour360Property] = useState<Property | null>(null);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('titulo', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map data to match Property interface
      const mappedProperties = (data || []).map(item => ({
        id: item.id,
        titulo: item.titulo,
        valor: item.valor || 0,
        area: item.area || 0,
        quartos: item.quartos || 0,
        bathrooms: item.bathrooms || 0,
        parking_spots: item.parking_spots || 0,
        listing_type: item.listing_type || 'venda',
        property_type: item.property_type || 'apartamento',
        visibility: item.visibility || 'public_site',
        descricao: item.descricao || '',
        fotos: item.fotos || [],
        created_at: item.created_at,
        reference_code: item.reference_code,
        has_sea_view: item.has_sea_view || false,
        furnishing_type: (item.furnishing_type as 'none' | 'furnished' | 'semi_furnished') || 'none',
        sea_distance: item.sea_distance,
        neighborhood: item.neighborhood,
        address: item.address,
        city: item.city,
        state: item.state
      }));

      setProperties(mappedProperties);
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

  const togglePropertyCollapse = (propertyId: string) => {
    setCollapsedProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Carregando...</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-4 bg-muted rounded flex-1"></div>
                  <div className="h-4 bg-muted rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Meus Imóveis
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus imóveis cadastrados
            </p>
          </div>
        </div>
        <Button onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade será implementada em breve" })}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Imóvel
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título do imóvel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchProperties}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              {property.fotos && property.fotos.length > 0 ? (
                <img
                  src={property.fotos[0]}
                  alt={property.titulo}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => {
                    setGalleryPhotos(property.fotos);
                    setGalleryInitialIndex(0);
                    setGalleryOpen(true);
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg truncate">{property.titulo}</h3>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(property.valor)}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {property.quartos}
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms}
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    {property.parking_spots}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {property.area}m²
                  </div>
                </div>

                {/* Visibility Badge */}
                <div className="flex justify-between items-center">
                  <div className="space-x-2">
                    {property.visibility === 'public_site' ? (
                      <Badge variant="default" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Site Público
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
                </div>
                
                {/* Collapsible Action Buttons */}
                <Collapsible 
                  open={!collapsedProperties.has(property.id)} 
                  onOpenChange={() => togglePropertyCollapse(property.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {collapsedProperties.has(property.id) ? 'Mostrar' : 'Ocultar'} opções
                      </span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${
                        collapsedProperties.has(property.id) ? 'rotate-180' : ''
                      }`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          toast({
                            title: "Visualização",
                            description: "Abrindo visualização do imóvel",
                          });
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          setGalleryPhotos(property.fotos || []);
                          setGalleryInitialIndex(0);
                          setGalleryOpen(true);
                        }}
                      >
                        <FileImage className="h-3 w-3 mr-1" />
                        Fotos
                      </Button>
                      <ShareButton 
                        property={{
                          ...property,
                          has_sea_view: property.has_sea_view || false,
                          bathrooms: property.bathrooms || 0,
                          parking_spots: property.parking_spots || 0,
                          neighborhood: property.neighborhood || '',
                          descricao: property.descricao || '',
                          user_id: user?.id || ''
                        }}
                        isOwner={true}
                        isAuthorized={true}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          setTour360Property(property);
                          setIsTour360ModalOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Tour 360°
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          toast({
                            title: "IA Descrição",
                            description: "Funcionalidade será implementada em breve",
                          });
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        IA Desc
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente uma busca diferente' : 'Comece adicionando seu primeiro imóvel'}
          </p>
        </div>
      )}

      {/* Photo Gallery */}
      <PhotoGallery
        isOpen={galleryOpen}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
        onClose={() => setGalleryOpen(false)}
      />

      {/* Tour 360 Modal */}
      <Tour360Modal
        isOpen={isTour360ModalOpen}
        onClose={() => setIsTour360ModalOpen(false)}
        onTourGenerated={(tourUrl) => {
          toast({
            title: "Tour 360° gerado!",
            description: "Seu tour virtual está pronto",
          });
        }}
        property={tour360Property}
      />
    </div>
  );
}