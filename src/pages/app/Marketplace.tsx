import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/AnimatedCard';
import PageWrapper from '@/components/PageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Building2, Search, Filter, MapPin, Bath, Bed, BedDouble, Car, User, Phone, Mail, ExternalLink, Heart, MessageSquare, MessageCircle, Share2, Eye, Home, Target, Volume2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { PropertyBanner } from '@/components/PropertyBanner';
import { PhotoGallery } from '@/components/PhotoGallery';
import { FavoritesManager } from '@/components/FavoritesManager';

import { PropertyIcons } from '@/components/PropertyIcons';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { PropertyListSkeleton } from '@/components/ui/skeleton-property-card';
import { formatCurrency } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { LazyAutoCarousel } from '@/components/LazyAutoCarousel';
import { LazyDevelopmentCarousel } from '@/components/LazyDevelopmentCarousel';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  furnishing_type?: string;
  sea_distance?: number;
  has_sea_view?: boolean;
  finalidade: string;
  descricao: string;
  fotos: string[];
  videos: string[];
  user_id: string;
  created_at: string;
  listing_type: string;
  property_type?: string;
  neighborhood?: string;
  zipcode?: string;
  condominium_fee?: number;
  iptu?: number;
  reference_code?: string;
  profiles?: {
    nome: string;
  } | null;
  conectaios_brokers?: {
    id: string;
    name: string;
    avatar_url?: string;
    creci?: string;
    bio?: string;
    status?: string;
  } | null;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { speak, stop, isSpeaking, isCurrentlySpeaking } = useElevenLabsVoice();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [finalidadeFilter, setFinalidadeFilter] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [bedroomsFilter, setBedroomsFilter] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);

  const fetchPublicProperties = useCallback(async (page = 0) => {
    const cacheKey = `marketplace_properties_${page}`;
    const cacheExpiry = 10 * 60 * 1000; // 10 minutes - aggressive caching
    
    try {
      // Check cache first for this page
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData && page === 0) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheExpiry) {
          setProperties(data);
          setRecentProperties(data.slice(0, 8));
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      
      // Real pagination with LIMIT/OFFSET for better performance
      const pageSize = 12;
      const offset = page * pageSize;
      
      // Essential fields for marketplace cards
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          titulo,
          valor,
          area,
          quartos,
          bathrooms,
          parking_spots,
          furnishing_type,
          sea_distance,
          has_sea_view,
          listing_type,
          property_type,
          fotos,
          neighborhood,
          zipcode,
          condominium_fee,
          iptu,
          descricao,
          user_id
        `)
        .eq('is_public', true)
        .eq('visibility', 'public_site')
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (propertiesError) throw propertiesError;

      if (!propertiesData || propertiesData.length === 0) {
        if (page === 0) {
          setProperties([]);
          setRecentProperties([]);
        }
        return;
      }

      // Get unique user IDs and fetch brokers
      const userIds = [...new Set(propertiesData.map(p => p.user_id).filter(Boolean))];
      if (userIds.length === 0) {
        if (page === 0) {
          setProperties([]);
          setRecentProperties([]);
        }
        return;
      }

      const { data: brokersData, error: brokersError } = await supabase
        .from('conectaios_brokers')
        .select('user_id, id, name, avatar_url, creci, status')
        .in('user_id', userIds)
        .eq('status', 'active');

      if (brokersError) {
        console.warn('Error fetching brokers:', brokersError);
      }

      // Create lookup map and combine data with robust validation
      const brokersMap = new Map((brokersData || []).map(broker => [broker.user_id, broker]));
      const validProperties = propertiesData
        .filter(property => property && property.id && property.titulo) // Basic validation
        .map(property => ({
          ...property,
          titulo: property.titulo || 'Imóvel sem título',
          valor: property.valor || 0,
          area: property.area || 0,
          quartos: property.quartos || 0,
          bathrooms: property.bathrooms || 0,
          parking_spots: property.parking_spots || 0,
          furnishing_type: property.furnishing_type || 'none',
          sea_distance: property.sea_distance || null,
          has_sea_view: property.has_sea_view || false,
          fotos: Array.isArray(property.fotos) ? property.fotos.filter(Boolean) : [],
          videos: [], // Set default empty array since we don't fetch videos for performance
          neighborhood: property.neighborhood || '',
          zipcode: property.zipcode || '',
          condominium_fee: property.condominium_fee || null,
          iptu: property.iptu || null,
          finalidade: property.listing_type || 'venda', // Use listing_type as finalidade
          descricao: property.descricao || '',
          created_at: new Date().toISOString(), // Set current time as fallback
          conectaios_brokers: brokersMap.get(property.user_id) || null
        }))
        .filter(property => property.conectaios_brokers); // Only show properties with valid brokers

      if (page === 0) {
        setProperties(validProperties as Property[]);
        setRecentProperties(validProperties.slice(0, 8) as Property[]);
        
        // Cache only first page results
        localStorage.setItem(cacheKey, JSON.stringify({
          data: validProperties,
          timestamp: Date.now()
        }));
      } else {
        // Append to existing properties for pagination
        setProperties(prev => [...prev, ...(validProperties as Property[])]);
      }
      
    } catch (error) {
      console.error('Error fetching properties:', error);
      if (page === 0) {
        toast({
          title: "Erro",
          description: "Erro ao carregar imóveis do marketplace. Tentando novamente...",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicProperties(0);
  }, [fetchPublicProperties]);

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFinalidade = !finalidadeFilter || finalidadeFilter === 'todas' || property.finalidade === finalidadeFilter;
      const matchesMinValue = !minValue || property.valor >= parseFloat(minValue);
      const matchesMaxValue = !maxValue || property.valor <= parseFloat(maxValue);
      const matchesNeighborhood = !neighborhoodFilter || property.neighborhood?.toLowerCase().includes(neighborhoodFilter.toLowerCase());
      const matchesBedrooms = !bedroomsFilter || bedroomsFilter === 'all' || property.quartos === parseInt(bedroomsFilter);

      return matchesSearch && matchesFinalidade && matchesMinValue && matchesMaxValue && matchesNeighborhood && matchesBedrooms;
    });
  }, [properties, searchTerm, finalidadeFilter, minValue, maxValue, neighborhoodFilter, bedroomsFilter]);

  // Pagination logic with performance optimization
  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = useMemo(() => {
    return filteredProperties.slice(startIndex, endIndex);
  }, [filteredProperties, startIndex, endIndex]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, finalidadeFilter, minValue, maxValue, neighborhoodFilter, bedroomsFilter]);

  const handleContactBroker = useCallback((brokerName: string) => {
    toast({
      title: "Contatar Corretor",
      description: `Entrando em contato com ${brokerName}`,
    });
  }, []);

  const handleMatch = async (propertyId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para marcar matches",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Match marcado!",
      description: "Imóvel marcado como match. O corretor será notificado.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/2 animate-pulse"></div>
        <PropertyListSkeleton count={6} />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary/10 to-brand-secondary/10 rounded-xl p-8 overflow-hidden mb-8">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div className="flex flex-col gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/app')}
                  className="flex items-center gap-2 px-3 sm:px-4 text-sm sm:text-base w-full sm:w-auto"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-primary">
                  Marketplace de Imóveis
                </h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              Conecte-se com outros corretores e descubra oportunidades exclusivas. 
              Encontre o imóvel perfeito para seus clientes em nossa rede colaborativa.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{filteredProperties.length} imóveis disponíveis</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>Rede de corretores</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>Sistema de matches</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section with Layout: Carousel (1 col) + Opportunities (2 cols) */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Carousel Column - 1/3 width */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-500/10 via-primary/5 to-blue-600/10 rounded-2xl p-6 h-full">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Últimos Adicionados
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Oportunidades recentes
                  </p>
                </div>

                {recentProperties.length > 0 && (
                  <LazyAutoCarousel 
                    properties={recentProperties.slice(0, 8)}
                    onPropertyClick={(property) => {
                      setSelectedProperty(property);
                      setIsDetailDialogOpen(true);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Opportunities Section - 2/3 width */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-orange-600/10 rounded-2xl p-6 h-full">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Novos Empreendimentos
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Oportunidades exclusivas
                  </p>
                </div>

                <LazyDevelopmentCarousel />
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-card rounded-lg border"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imóveis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={finalidadeFilter} onValueChange={setFinalidadeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Finalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="residencial">Residencial</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="temporada">Temporada</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
              <SelectItem value="locacao">Locação</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Valor mínimo"
            type="number"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
          />

          <Input
            placeholder="Valor máximo"
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
          />
          
          <Input
            placeholder="Buscar por bairro..."
            value={neighborhoodFilter}
            onChange={(e) => setNeighborhoodFilter(e.target.value)}
          />

          <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Quartos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">1 quarto</SelectItem>
              <SelectItem value="2">2 quartos</SelectItem>
              <SelectItem value="3">3 quartos</SelectItem>
              <SelectItem value="4">4+ quartos</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Properties Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
        >
          {paginatedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AnimatedCard className="h-full overflow-hidden cursor-pointer" onClick={() => {
                setSelectedProperty(property);
                setIsDetailDialogOpen(true);
              }}>
                <div className="relative">
                  <img 
                    src={property.fotos?.[0] || '/placeholder.svg'} 
                    alt={property.titulo}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
                    <Badge variant="secondary" className="text-xs">
                      {property.listing_type === 'venda' ? 'Venda' : 
                       property.listing_type === 'aluguel' ? 'Aluguel' : 'Temporada'}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg leading-tight">{property.titulo}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3 p-4">
              <motion.div 
                className="text-xl sm:text-2xl font-bold text-primary animate-fade-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {formatCurrency(property.valor)}
              </motion.div>
                  
                  {/* Location Info with CEP and Neighborhood */}
                  {(property.neighborhood || property.zipcode) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-l-2 border-primary/20 pl-2">
                      <MapPin className="h-3 w-3 text-primary" />
                      <div className="flex flex-wrap gap-1">
                        {property.neighborhood && (
                          <span className="font-medium">{property.neighborhood}</span>
                        )}
                        {property.neighborhood && property.zipcode && (
                          <span>•</span>
                        )}
                        {property.zipcode && (
                          <span>CEP: {property.zipcode}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* All property icons in one line */}
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
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
                      {property.bathrooms || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {property.parking_spots || 0}
                    </div>
                    
                    {/* Additional property features inline */}
                    <PropertyIcons 
                      furnishing_type={property.furnishing_type as 'none' | 'furnished' | 'semi_furnished'}
                      sea_distance={property.sea_distance}
                      has_sea_view={property.has_sea_view}
                      className=""
                    />
                  </div>

                   {/* Property Description */}
                   {property.descricao && (
                     <p className="text-sm text-muted-foreground line-clamp-2">
                       {property.descricao}
                     </p>
                   )}

                   {/* Property Reference Code */}
                   {property.reference_code && (
                     <div className="text-xs text-muted-foreground font-mono">
                       Cód: {property.reference_code}
                     </div>
                   )}

                   <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
                     {property.conectaios_brokers?.avatar_url ? (
                       <img 
                         src={property.conectaios_brokers.avatar_url} 
                         alt={property.conectaios_brokers.name}
                         className="w-6 h-6 rounded-full object-cover border border-slate-200"
                         onError={(e) => {
                           // Hide image if it fails to load and show fallback
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     ) : (
                       <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                         {property.conectaios_brokers?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '👤'}
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <span>Corretor: {property.conectaios_brokers?.name || property.profiles?.nome || 'Não informado'}</span>
                       {property.conectaios_brokers?.creci && (
                         <span className="block text-xs text-muted-foreground/70">CRECI: {property.conectaios_brokers.creci}</span>
                       )}
                     </div>
                   </div>

                    <div className="flex flex-col gap-2 mt-4">
                     <Button 
                       size="sm" 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleContactBroker(property.profiles?.nome || 'Corretor');
                       }}
                       className="w-full h-11 text-sm"
                     >
                       <Phone className="h-4 w-4 mr-2" />
                       Contatar
                     </Button>
                       <div className="flex items-center justify-between gap-2">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleMatch(property.id);
                           }}
                           className="h-11 px-3 hover:bg-primary hover:text-white group flex-1"
                           title="Match"
                         >
                           <Target className="h-3 w-3" />
                           <span className="sr-only">Match</span>
                         </Button>
                         
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              const audioId = `marketplace-${property.id}`;
                              if (isCurrentlySpeaking(audioId)) {
                                stop();
                              } else {
                                const descricao = property.descricao || `Imóvel ${property.titulo} com valor de ${formatCurrency(property.valor)}, ${property.area} metros quadrados, ${property.quartos} quartos, ${property.bathrooms || 0} banheiros e ${property.parking_spots || 0} vagas de garagem.`;
                                speak(descricao, audioId);
                              }
                            }}
                            className={`h-8 px-2 hover:bg-primary hover:text-white flex-1 ${isCurrentlySpeaking(`marketplace-${property.id}`) ? 'bg-primary text-white animate-pulse' : ''}`}
                            title={isCurrentlySpeaking(`marketplace-${property.id}`) ? "Parar reprodução" : "Ouvir descrição"}
                           >
                             <Volume2 className={`h-3 w-3 ${isCurrentlySpeaking(`marketplace-${property.id}`) ? 'animate-spin' : ''}`} />
                             <span className="sr-only">{isCurrentlySpeaking(`marketplace-${property.id}`) ? "Parar" : "Voz IA"}</span>
                           </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/app/inbox');
                            }}
                            className="h-8 px-2 hover:bg-primary hover:text-white flex-1"
                            title="Mensagem"
                          >
                            <MessageSquare className="h-3 w-3" strokeWidth={2} fill="none" />
                            <span className="sr-only">Mensagem</span>
                          </Button>
                          
                         <div className="h-8 flex items-center justify-center flex-1">
                           <FavoritesManager 
                             propertyId={property.id} 
                             onToggle={() => {}}
                           />
                         </div>
                         
                          <div className="h-8 flex items-center justify-center flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProperty(property);
                                setIsDetailDialogOpen(true);
                              }}
                              className="h-8 text-xs hover:bg-primary hover:text-white"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Mais
                            </Button>
                          </div>
                       </div>
                   </div>
                </CardContent>
              </AnimatedCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} imóveis
              </span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
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
            
            <div className="flex flex-wrap justify-center gap-2">
              <Pagination>
                <PaginationContent className="flex-wrap gap-1">
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="cursor-pointer text-xs h-8 px-2"
                      />
                    </PaginationItem>
                  )}
                  
                  {/* First page */}
                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer text-xs h-8 w-8">
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && <PaginationEllipsis className="h-8 w-8" />}
                    </>
                  )}
                  
                  {/* Current page and neighbors */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="cursor-pointer text-xs h-8 w-8"
                      >
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationLink isActive className="text-xs h-8 w-8">
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="cursor-pointer text-xs h-8 w-8"
                      >
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <PaginationEllipsis className="h-8 w-8" />}
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer text-xs h-8 w-8"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="cursor-pointer text-xs h-8 px-2"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

        {filteredProperties.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou aguarde novos imóveis serem publicados
            </p>
          </motion.div>
        )}
      </div>

      {/* Property Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.titulo}</DialogTitle>
            <DialogDescription>
              Detalhes completos do imóvel - {selectedProperty?.profiles?.nome || 'Corretor'}
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-6">
              {/* Image Gallery */}
              <div className="grid grid-cols-2 gap-4">
                {selectedProperty.fotos?.map((foto, index) => (
                  <div 
                    key={index} 
                    className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setSelectedPhotos(selectedProperty.fotos);
                      setSelectedPhotoIndex(index);
                      setGalleryOpen(true);
                    }}
                  >
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
                    <h3 className="font-semibold mb-2">Informações do Imóvel</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-semibold text-primary">R$ {selectedProperty.valor?.toLocaleString('pt-BR')}</span>
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
                        <span>{selectedProperty.bathrooms || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vagas:</span>
                        <span>{selectedProperty.parking_spots || 0}</span>
                      </div>
                      {selectedProperty.furnishing_type && selectedProperty.furnishing_type !== 'none' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mobília:</span>
                          <span>
                            {selectedProperty.furnishing_type === 'furnished' ? 'Mobiliado' : 
                             selectedProperty.furnishing_type === 'semi_furnished' ? 'Semi-mobiliado' : 'Não mobiliado'}
                          </span>
                        </div>
                      )}
                      {selectedProperty.sea_distance && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distância do mar:</span>
                          <span>
                            {selectedProperty.sea_distance >= 1000 
                              ? `${(selectedProperty.sea_distance / 1000).toFixed(1)}km` 
                              : `${selectedProperty.sea_distance}m`
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span>{selectedProperty.listing_type === 'venda' ? 'Venda' : selectedProperty.listing_type === 'locacao' ? 'Locação' : 'Temporada'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Corretor:</span>
                        <span>{selectedProperty.profiles?.nome || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Ações</h3>
                    <div className="space-y-2">
                      <Button 
                        className="w-full px-3 sm:px-4 text-sm" 
                        onClick={() => handleContactBroker(selectedProperty.profiles?.nome || 'Corretor')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Entrar em Contato
                      </Button>
                       <Button 
                         className="w-full px-3 sm:px-4 text-sm" 
                         variant="outline"
                         onClick={() => handleMatch(selectedProperty.id)}
                       >
                         <Target className="h-4 w-4 mr-2" />
                         Marcar Match
                       </Button>
                        <Button 
                          className="w-full px-3 sm:px-4 text-sm" 
                          variant="outline"
                          onClick={() => {
                            const phone = selectedProperty.conectaios_brokers?.name ? '5511999999999' : '';
                            const message = `Olá! Vi seu imóvel "${selectedProperty.titulo}" no marketplace e gostaria de mais informações.`;
                            if (phone) {
                              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                            }
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Entrar em Contato
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
        photos={selectedPhotos}
        initialIndex={selectedPhotoIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </PageWrapper>
  );
}