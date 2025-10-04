import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/AnimatedCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { formatCurrency } from '@/lib/utils';
import { 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  Volume2, 
  BedDouble, 
  Bath, 
  Car, 
  Home, 
  Search,
  Filter,
  Eye,
  Star,
  CheckCircle,
  Square,
  ImageIcon
} from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';
import { PropertyPresentation } from '@/components/PropertyPresentation';
import { MinisiteAIChat } from '@/components/MinisiteAIChat';
import { PropertyBanner } from '@/components/PropertyBanner';

interface MinisiteConfig {
  id: string;
  broker_id: string;
  template_id: string;
  primary_color: string;
  secondary_color: string;
  title: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
  custom_message: string;
  show_properties: boolean;
  show_contact_form: boolean;
  show_about: boolean;
  config_data: any;
  generated_url: string;
  broker?: {
    name: string;
    bio: string;
    avatar_url: string;
    creci: string;
  };
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  quartos: number;
  area: number;
  fotos: string[];
  neighborhood: string;
  city: string;
  descricao: string;
  bathrooms: number;
  parking_spots: number;
  listing_type: string;
  property_type: string;
  address: string;
  state: string;
  features: any;
  reference_code?: string;
  furnishing_type?: string;
  condominium_fee?: number;
  iptu?: number;
  price_per_m2?: number;
  has_sea_view?: boolean;
  sea_distance?: number;
  year_built?: number;
  zipcode?: string;
  banner_type?: string | null;
}

export default function MinisiteView() {
  const { username } = useParams();
  const { speak, stop, isSpeaking } = useElevenLabsVoice();
  const [config, setConfig] = useState<MinisiteConfig | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('todos');
  const [selectedListingType, setSelectedListingType] = useState('todos');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBedrooms, setSelectedBedrooms] = useState('todos');

  useEffect(() => {
    if (username) {
      fetchMinisiteData();
    }
  }, [username]);

  const fetchMinisiteData = async () => {
    try {
      console.log('Fetching minisite for username:', username);
      const urlToFind = username?.startsWith('@') ? username : `@${username}`;
      console.log('Looking for URL:', urlToFind);
      
      // First, let's check what minisites exist in the database
      const { data: allMinisites, error: allError } = await supabase
        .from('minisite_configs')
        .select('generated_url, is_active, broker_id');
      
      console.log('All minisites in database:', allMinisites);
      console.log('All minisites error:', allError);
      
      // 1. Buscar broker pelo username
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('id, user_id, name, bio, avatar_url, creci')
        .eq('username', urlToFind)
        .maybeSingle();

      console.log('Broker data:', brokerData);
      console.log('Broker error:', brokerError);

      let finalBrokerData = brokerData;

      // Try alternative search without @ prefix if not found
      if (!brokerData) {
        const altUrlToFind = username?.startsWith('@') ? username.substring(1) : username;
        console.log('Trying alternative username:', altUrlToFind);
        
        const { data: altBrokerData, error: altBrokerError } = await supabase
          .from('brokers')
          .select('id, user_id, name, bio, avatar_url, creci')
          .eq('username', altUrlToFind)
          .maybeSingle();
        
        console.log('Alternative broker data:', altBrokerData);
        
        if (!altBrokerData) {
          throw new Error('Minisite não encontrado');
        }
        
        finalBrokerData = altBrokerData;
      }

      // 2. Buscar minisite_config pelo broker_id
      const { data: configData, error: configError } = await supabase
        .from('minisite_configs')
        .select('*')
        .eq('broker_id', finalBrokerData.id)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Config data:', configData);
      console.log('Config error:', configError);

      if (configError) throw configError;
      
      if (!configData) {
        throw new Error('Minisite não encontrado');
      }

      // 3. Adicionar dados do broker ao config
      setConfig({
        ...configData,
        broker: {
          name: finalBrokerData.name,
          bio: finalBrokerData.bio,
          avatar_url: finalBrokerData.avatar_url,
          creci: finalBrokerData.creci
        }
      });

      // Fetch broker's properties if show_properties is enabled
      if (configData?.show_properties && finalBrokerData?.user_id) {
        console.log('🏠 Fetching properties for user_id:', finalBrokerData.user_id);
        
        try {
          console.log('🔍 Fetching properties for user_id:', finalBrokerData.user_id);
            
            // Limpar cache do minisite antes de carregar
            const clearMinisiteCache = () => {
              const keys = Object.keys(localStorage);
              keys.forEach(key => {
                if (key.startsWith('minisite_')) {
                  localStorage.removeItem(key);
                }
              });
            };
            clearMinisiteCache();
            
            // Query properties with comprehensive error handling and detailed logging
            console.log('🔄 [MINISITE] Iniciando query de imóveis com filtros:', {
              owner_id: finalBrokerData.user_id,
              is_public: true,
              show_on_minisite: true,
              status: 'available'
            });
            
            const { data: propertiesData, error: propertiesError } = await supabase
              .from('imoveis')
              .select(`
                id, title, price, bedrooms, area_total, neighborhood, city, 
                description, bathrooms, parking, purpose, property_type,
                address, state, created_at, updated_at,
                is_furnished, condo_fee, iptu, vista_mar,
                distancia_mar, construction_year, zipcode, is_public, visibility, show_on_site, show_on_minisite, status,
                property_features(key, value),
                property_images(url, is_cover, position)
              `)
              .eq('owner_id', finalBrokerData.user_id)
              .eq('status', 'available')
              .eq('is_public', true)
              .eq('show_on_minisite', true)
              .in('visibility', ['public_site', 'partners'])
              .order('created_at', { ascending: false })
              .limit(50);

            console.log('📊 [MINISITE] Resultado da query:', {
              status: propertiesError ? 'error' : 'success',
              error: propertiesError?.message,
              found: propertiesData?.length || 0,
              owner_id: finalBrokerData.user_id,
              broker_id: configData.broker_id,
              firstProperty: propertiesData?.[0] ? {
                id: propertiesData[0].id,
                title: propertiesData[0].title,
                is_public: propertiesData[0].is_public,
                visibility: propertiesData[0].visibility,
                show_on_minisite: propertiesData[0].show_on_minisite,
                status: propertiesData[0].status
              } : null
            });

            if (propertiesError) {
              console.error('❌ Error fetching properties:', propertiesError);
              setProperties([]);
              setFilteredProperties([]);
            } else if (propertiesData && propertiesData.length > 0) {
              console.log('✅ Properties fetched successfully:', propertiesData?.length || 0);
              
              // Mapear dados do banco para interface Property
              const mappedProperties = propertiesData.map(prop => {
                // Extrair imagens das property_images
                const fotos = (prop.property_images || [])
                  .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                  .map((img: any) => img.url);

                // Extrair banner_type e furnishing_type das features
                const bannerTypeFeature = (prop.property_features || []).find(
                  (f: any) => f.key === 'banner_type'
                );
                const furnishingFeature = (prop.property_features || []).find(
                  (f: any) => f.key === 'furnishing_type'
                );

                return {
                  id: prop.id,
                  titulo: prop.title || '',
                  valor: prop.price || 0,
                  quartos: prop.bedrooms || 0,
                  area: prop.area_total || 0,
                  fotos: fotos,
                  neighborhood: prop.neighborhood || '',
                  city: prop.city || '',
                  descricao: prop.description || '',
                  bathrooms: prop.bathrooms || 0,
                  parking_spots: prop.parking || 0,
                  listing_type: prop.purpose || '',
                  property_type: prop.property_type || '',
                  address: prop.address || '',
                  state: prop.state || '',
                  features: {},
                  furnishing_type: furnishingFeature?.value || (prop.is_furnished ? 'furnished' : 'none'),
                  condominium_fee: prop.condo_fee,
                  iptu: prop.iptu,
                  has_sea_view: prop.vista_mar,
                  sea_distance: prop.distancia_mar,
                  year_built: prop.construction_year,
                  zipcode: prop.zipcode,
                  banner_type: bannerTypeFeature?.value || null
                };
              });

              setProperties(mappedProperties);
              setFilteredProperties(mappedProperties);
            }
        } catch (error) {
          console.error('💥 Error in properties fetch process:', error);
          setProperties([]);
          setFilteredProperties([]);
        }
      } else {
        console.log('🚫 Properties disabled or no user_id:', {
          show_properties: configData?.show_properties,
          user_id: finalBrokerData?.user_id
        });
        setProperties([]);
        setFilteredProperties([]);
      }
    } catch (error) {
      console.error('Error fetching minisite data:', error);
      toast({
        title: "Erro",
        description: "Minisite não encontrado ou inativo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on search criteria
  useEffect(() => {
    let filtered = [...properties];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property type filter
    if (selectedType !== 'todos') {
      filtered = filtered.filter(property => property.property_type === selectedType);
    }

    // Listing type filter
    if (selectedListingType !== 'todos') {
      filtered = filtered.filter(property => property.listing_type === selectedListingType);
    }

    // Price range filter
    if (minPrice) {
      filtered = filtered.filter(property => property.valor >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(property => property.valor <= parseFloat(maxPrice));
    }

    // Bedrooms filter
    if (selectedBedrooms !== 'todos') {
      filtered = filtered.filter(property => property.quartos === parseInt(selectedBedrooms));
    }

    setFilteredProperties(filtered);
  }, [properties, searchTerm, selectedType, selectedListingType, minPrice, maxPrice, selectedBedrooms]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.nome || !contactForm.email || !contactForm.telefone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          nome: contactForm.nome,
          email: contactForm.email,
          telefone: contactForm.telefone,
          interesse: contactForm.mensagem || 'Contato via minisite',
          empresa: 'ConectAIOS Minisite'
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Sua mensagem foi enviada. O corretor entrará em contato em breve!",
      });

      setContactForm({ nome: '', email: '', telefone: '', mensagem: '' });
    } catch (error) {
      console.error('Error submitting contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = () => {
    if (config?.whatsapp) {
      const message = encodeURIComponent(`Olá! Vi seu minisite e gostaria de conversar sobre imóveis.`);
      window.open(`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando minisite...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Minisite não encontrado</h1>
          <p className="text-muted-foreground">O minisite que você está procurando não existe ou foi desativado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ '--primary': config.primary_color, '--secondary': config.secondary_color } as any}>
      {/* Header */}
      <header className="py-8 text-center" style={{ backgroundColor: config.primary_color }}>
        <div className="container mx-auto px-4">
          {config.broker?.avatar_url && (
            <img 
              src={config.broker.avatar_url} 
              alt={config.broker.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white"
            />
          )}
          <h1 className="text-4xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-white/90 text-lg">{config.description}</p>
          {config.broker && (
            <p className="text-white/80 mt-2">
              {config.broker.name} {config.broker.creci && `- CRECI: ${config.broker.creci}`}
            </p>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {config.show_about && config.broker?.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Sobre o Corretor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{config.broker.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Properties Section */}
            {config.show_properties && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Imóveis Disponíveis
                    {properties.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({filteredProperties.length} de {properties.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Search and Filters */}
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Pesquisar Imóveis</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {filteredProperties.length} de {properties.length} imóveis
                      </span>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Input
                        placeholder="Buscar por título, descrição ou localização..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      <Select value={selectedListingType} onValueChange={setSelectedListingType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Finalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas</SelectItem>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="locacao">Locação</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="apartamento">Apartamento</SelectItem>
                          <SelectItem value="casa">Casa</SelectItem>
                          <SelectItem value="terreno">Terreno</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
                        <SelectTrigger>
                          <SelectValue placeholder="Quartos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="0">Kitnet</SelectItem>
                          <SelectItem value="1">1 quarto</SelectItem>
                          <SelectItem value="2">2 quartos</SelectItem>
                          <SelectItem value="3">3 quartos</SelectItem>
                          <SelectItem value="4">4+ quartos</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Preço mínimo"
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />

                      <Input
                        placeholder="Preço máximo"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                    
                    {/* Clear Filters Button */}
                    {(searchTerm || selectedType !== 'todos' || selectedListingType !== 'todos' || 
                      selectedBedrooms !== 'todos' || minPrice || maxPrice) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedType('todos');
                          setSelectedListingType('todos');
                          setSelectedBedrooms('todos');
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Limpar Filtros
                      </Button>
                    )}
                  </div>

                  {!properties || properties.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum imóvel disponível</h3>
                      <p className="text-muted-foreground">
                        Este corretor ainda não publicou imóveis ou eles não estão disponíveis no momento.
                      </p>
                    </div>
                  ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-8">
                      <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum imóvel corresponde aos filtros</h3>
                      <p className="text-muted-foreground">
                        {properties.length} {properties.length === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}. Ajuste os filtros para ver mais opções.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredProperties.map((property) => (
                        <AnimatedCard key={property.id} className="overflow-hidden">
                          {/* Property Image */}
                          <div className="aspect-[4/3] relative bg-gray-200">
                            <PropertyBanner bannerType={property.banner_type} />
                            {property.fotos && property.fotos.length > 0 ? (
                              <img
                                src={property.fotos[0]}
                                alt={property.titulo}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-500" />
                              </div>
                            )}
                            
                            {/* Badge de tipo */}
                            <div className="absolute top-2 left-2">
                              <span className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
                                {property.listing_type === 'venda' ? 'Venda' : 'Locação'}
                              </span>
                            </div>

                            {/* Badge vista mar */}
                            {property.has_sea_view && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                                  Vista Mar
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4">
                            {/* Title and Reference */}
                            <div className="mb-3">
                              <h3 className="font-semibold text-lg mb-1 line-clamp-2">{property.titulo}</h3>
                              {property.reference_code && (
                                <p className="text-xs text-muted-foreground">Cód: {property.reference_code}</p>
                              )}
                            </div>

                            {/* Price */}
                            <div className="mb-3">
                              <p className="text-2xl font-bold text-primary mb-1">
                                {formatCurrency(property.valor)}
                              </p>
                              {property.price_per_m2 && (
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(property.price_per_m2)}/m²
                                </p>
                              )}
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1 mb-3">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {property.neighborhood}, {property.city}
                              </span>
                            </div>

                            {/* Property Details - Organized icons */}
                            <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <BedDouble className="h-4 w-4" />
                                <span>{property.quartos}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Bath className="h-4 w-4" />
                                <span>{property.bathrooms || 0}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Car className="h-4 w-4" />
                                <span>{property.parking_spots || 0}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Square className="h-4 w-4" />
                                <span>{property.area}m²</span>
                              </div>
                            </div>

                            {/* Additional Costs */}
                            {(property.condominium_fee || property.iptu) && (
                              <div className="mb-3 text-sm text-muted-foreground">
                                {property.condominium_fee && (
                                  <span className="mr-3">Cond: {formatCurrency(property.condominium_fee)}</span>
                                )}
                                {property.iptu && (
                                  <span>IPTU: {formatCurrency(property.iptu)}</span>
                                )}
                              </div>
                            )}

                            {/* Features */}
                            <div className="mb-3">
                              {property.sea_distance && property.sea_distance <= 500 && (
                                <span className="inline-block bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs mr-2">
                                  {property.sea_distance}m do mar
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {property.descricao && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {property.descricao}
                              </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <ShareButton
                                property={{
                                  id: property.id,
                                  titulo: property.titulo,
                                  valor: property.valor,
                                  area: property.area,
                                  quartos: property.quartos,
                                  bathrooms: property.bathrooms || 0,
                                  parking_spots: property.parking_spots || 0,
                                  fotos: property.fotos || [],
                                  neighborhood: property.neighborhood || '',
                                  descricao: property.descricao || '',
                                  property_type: property.property_type || '',
                                  listing_type: property.listing_type || 'venda',
                                  has_sea_view: property.has_sea_view || false,
                                  furnishing_type: property.furnishing_type || '',
                                  sea_distance: property.sea_distance || 0
                                }}
                                isOwner={false}
                                isAuthorized={true}
                              />
                              <Button
                                onClick={() => window.open(`/imovel/${property.id}`, '_blank')}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Custom Message */}
            {config.custom_message && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-lg italic">{config.custom_message}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* WhatsApp Button - Destaque no topo */}
            {config.whatsapp && (
              <Button 
                onClick={openWhatsApp}
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Quero ser atendido
              </Button>
            )}
            
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{config.phone}</span>
                  </div>
                )}
                {config.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>{config.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Form */}
            {config.show_contact_form && (
              <Card>
                <CardHeader>
                  <CardTitle>Envie sua Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={contactForm.nome}
                        onChange={(e) => setContactForm(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={contactForm.telefone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, telefone: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="mensagem">Mensagem</Label>
                      <Textarea
                        id="mensagem"
                        value={contactForm.mensagem}
                        onChange={(e) => setContactForm(prev => ({ ...prev, mensagem: e.target.value }))}
                        placeholder="Como posso ajudá-lo?"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Assistant */}
      {config?.broker_id && (
        <MinisiteAIChat 
          brokerId={config.broker_id}
          brokerName={config.broker?.name || 'Corretor'}
          brokerAvatar={config.broker?.avatar_url}
        />
      )}

      {/* Footer */}
      <footer className="text-center py-6 border-t">
        <p className="text-muted-foreground">
          Minisite criado com <span className="text-primary">ConectAIOS</span>
        </p>
      </footer>
    </div>
  );
}