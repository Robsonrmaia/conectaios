import { useState, useEffect } from 'react';
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
import { Building2, Search, Filter, MapPin, Bath, Bed, Car, User, Phone, Mail, ExternalLink, Heart, MessageSquare, Share2, Eye, Home, Target, Volume2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { PhotoGallery } from '@/components/PhotoGallery';
import { FavoritesManager } from '@/components/FavoritesManager';
import { ShareButton } from '@/components/ShareButton';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { formatCurrency } from '@/lib/utils';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  finalidade: string;
  descricao: string;
  fotos: string[];
  videos: string[];
  user_id: string;
  created_at: string;
  listing_type: string;
  neighborhood?: string;
  profiles?: {
    nome: string;
  };
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { speak, stop, isSpeaking } = useTextToSpeech();
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

  useEffect(() => {
    fetchPublicProperties();
  }, []);

  const fetchPublicProperties = async () => {
    try {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('conectaios_properties')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Fetch profiles for each property
      const propertiesWithProfiles = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: profileData } = await supabase
            .from('conectaios_profiles')
            .select('nome')
            .eq('user_id', property.user_id)
            .single();
          
          return {
            ...property,
            profiles: profileData
          };
        })
      );

      setProperties(propertiesWithProfiles);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imóveis do marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
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

  // Pagination logic
  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, finalidadeFilter, minValue, maxValue, neighborhoodFilter, bedroomsFilter]);

  const handleContactBroker = (brokerName: string) => {
    toast({
      title: "Contatar Corretor",
      description: `Entrando em contato com ${brokerName}`,
    });
  };

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
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-48 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary/10 to-brand-secondary/10 rounded-xl p-8 overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/app')}
                  className="flex items-center gap-2 w-fit"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
                <h1 className="text-2xl sm:text-4xl font-bold text-primary">
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

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-card rounded-lg border"
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
                
                <CardHeader>
                  <CardTitle className="text-lg">{property.titulo}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Por: {property.profiles?.nome || 'Corretor'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold text-primary">
                    R$ {property.valor?.toLocaleString('pt-BR')}
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
                       {property.bathrooms || 0}
                     </div>
                     <div className="flex items-center gap-1">
                       <Car className="h-3 w-3" />
                       {property.parking_spots || 0}
                     </div>
                   </div>

                  {property.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {property.descricao}
                    </p>
                  )}

                   <div className="flex flex-col gap-2 mt-4">
                     <Button 
                       size="sm" 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleContactBroker(property.profiles?.nome || 'Corretor');
                       }}
                       className="w-full h-8 text-xs"
                     >
                       <Phone className="h-3 w-3 mr-1" />
                       Contatar
                     </Button>
                      <div className="grid grid-cols-5 gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMatch(property.id);
                          }}
                          className="h-7 w-full p-0 hover:bg-primary hover:text-white group"
                          title="Match"
                        >
                          <Target className="h-3 w-3" />
                          <span className="sr-only">Match</span>
                        </Button>
                        <div className="w-full">
                          <FavoritesManager 
                            propertyId={property.id} 
                            onToggle={() => {}}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSpeaking) {
                              stop();
                            } else {
                              const descricao = property.descricao || `Imóvel ${property.titulo} com valor de ${formatCurrency(property.valor)}, ${property.area} metros quadrados, ${property.quartos} quartos, ${property.bathrooms || 0} banheiros e ${property.parking_spots || 0} vagas de garagem.`;
                              speak(descricao);
                            }
                          }}
                          className="h-7 w-full p-0 hover:bg-primary hover:text-white"
                          title={isSpeaking ? "Parar reprodução" : "Ouvir descrição"}
                        >
                          <Volume2 className="h-3 w-3" />
                          <span className="sr-only">{isSpeaking ? "Parar" : "Voz IA"}</span>
                        </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate('/app/inbox');
                           }}
                           className="h-7 w-full p-0 hover:bg-primary hover:text-white"
                           title="Mensagem"
                         >
                           <MessageSquare className="h-3 w-3" strokeWidth={2} fill="none" />
                           <span className="sr-only">Mensagem</span>
                         </Button>
                        <div className="w-full">
                          <ShareButton
                            propertyId={property.id}
                            propertyTitle={property.titulo}
                            ownerUserId={property.user_id}
                            isOwner={false}
                          />
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
            
// ============= Lines 432-495 of 628 total lines =============

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
                        className="w-full" 
                        onClick={() => handleContactBroker(selectedProperty.profiles?.nome || 'Corretor')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Entrar em Contato
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleMatch(selectedProperty.id)}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Marcar Match
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
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