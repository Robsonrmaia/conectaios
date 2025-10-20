import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/AnimatedCard';
import PageWrapper from '@/components/PageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatExternal } from '@/hooks/useChatExternal';
import { ChatExternalModal } from '@/components/ChatExternalModal';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Building2, Search, Filter, MapPin, Bath, Bed, BedDouble, Car, User, Phone, Mail, ExternalLink, Heart, MessageSquare, MessageCircle, Share2, Eye, Home, Target, Volume2, CheckSquare, Square, LayoutGrid, List, Grid2X2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { PropertyBanner } from '@/components/PropertyBanner';
import { PhotoGallery } from '@/components/PhotoGallery';
import { FavoritesManager } from '@/components/FavoritesManager';
import { Checkbox } from '@/components/ui/checkbox';

import { PropertyIcons } from '@/components/PropertyIcons';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { PropertyListSkeleton } from '@/components/ui/skeleton-property-card';
import { formatCurrency } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { LazyAutoCarousel } from '@/components/LazyAutoCarousel';
import { LazyDevelopmentCarousel } from '@/components/LazyDevelopmentCarousel';
import { CITIES, DEFAULT_CITY, STORAGE_KEYS, getCityLabel } from '@/config/cities';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { SubscriptionBlocker } from '@/components/SubscriptionBlocker';
import { PropertyListView } from '@/components/marketplace/PropertyListView';
import { PropertyIconView } from '@/components/marketplace/PropertyIconView';

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
  owner_id: string; // ID do proprietário/corretor (equivalente a user_id)
  created_at: string;
  type?: string; // Tipo de imóvel (house, apartment, land, etc)
  listing_type: string;
  property_type?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  condominium_fee?: number;
  iptu?: number;
  reference_code?: string;
  verified?: boolean;
  banner_type?: string | null;
  status?: string;
  profiles?: {
    nome: string;
  } | null;
  brokers?: {
    id: string;
    name: string;
    avatar_url?: string;
    creci?: string;
    bio?: string;
    status?: string;
  } | null;
  conectaios_brokers?: {
    id: string;
    name: string;
    avatar_url?: string;
    creci?: string;
    bio?: string;
  } | null;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { speak, stop, isSpeaking, isCurrentlySpeaking } = useElevenLabsVoice();
  const { canAccessFeature, isSuspended, getBlockMessage } = useSubscriptionGuard();
  
  if (isSuspended) {
    return <SubscriptionBlocker 
      status="suspended"
      message={getBlockMessage()}
    />;
  }
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // Tipo de imóvel (casa, apartamento, etc)
  const [categoriaFilter, setCategoriaFilter] = useState(''); // Categoria (residencial, comercial, etc)
  const [finalidadeFilter, setFinalidadeFilter] = useState(''); // Finalidade (venda, locação)
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [bedroomsFilter, setBedroomsFilter] = useState('');
  
  // Filtro de cidade - Carrega última cidade selecionada ou usa padrão
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_CITY);
    return saved || DEFAULT_CITY;
  });
  
  // Salvar cidade selecionada no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LAST_SELECTED_CITY, selectedCity);
  }, [selectedCity]);
  
  // Pending filters (applied only when "Buscar" is clicked)
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  const [pendingTypeFilter, setPendingTypeFilter] = useState('');
  const [pendingCategoriaFilter, setPendingCategoriaFilter] = useState('');
  const [pendingFinalidadeFilter, setPendingFinalidadeFilter] = useState('');
  const [pendingMinValue, setPendingMinValue] = useState('');
  const [pendingMaxValue, setPendingMaxValue] = useState('');
  const [pendingNeighborhoodFilter, setPendingNeighborhoodFilter] = useState('');
  const [pendingBedroomsFilter, setPendingBedroomsFilter] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection states
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  
  // View mode state (declared before getItemsPerPage)
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'icons'>(() => {
    const saved = localStorage.getItem('marketplace_view_mode');
    return (saved as 'cards' | 'list' | 'icons') || 'cards';
  });
  
  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('marketplace_view_mode', viewMode);
  }, [viewMode]);
  
  // Dynamic items per page based on view mode
  const getItemsPerPage = useCallback(() => {
    if (currentPage === 1) {
      // First page has more items
      switch(viewMode) {
        case 'cards': return 50;
        case 'list': return 80;
        case 'icons': return 120;
        default: return 50;
      }
    } else {
      // Subsequent pages
      switch(viewMode) {
        case 'cards': return 12;
        case 'list': return 20;
        case 'icons': return 40;
        default: return 12;
      }
    }
  }, [currentPage, viewMode]);
  
  const itemsPerPage = getItemsPerPage();
  const { openChatModal, closeChatModal, modalOpen, chatUrl } = useChatExternal();
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  
  // Debug and stats states
  const [showStats, setShowStats] = useState(false);
  const [brokerStats, setBrokerStats] = useState<{[key: string]: number}>({});
  const [myPropertiesFirst, setMyPropertiesFirst] = useState(false);
  
  // Apply pending filters
  const handleSearch = () => {
    setSearchTerm(pendingSearchTerm);
    setTypeFilter(pendingTypeFilter);
    setCategoriaFilter(pendingCategoriaFilter);
    setFinalidadeFilter(pendingFinalidadeFilter);
    setMinValue(pendingMinValue);
    setMaxValue(pendingMaxValue);
    setNeighborhoodFilter(pendingNeighborhoodFilter);
    setBedroomsFilter(pendingBedroomsFilter);
    setCurrentPage(1);
  };

  const fetchPublicProperties = useCallback(async (page = 0, forceRefresh = false) => {
    const cacheKey = `marketplace_properties_${page}`;
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes - reduzido para melhor atualização
    
    try {
      // Check cache first for this page (skip if force refresh)
      if (!forceRefresh) {
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
      }

      setLoading(true);
      
      // Implementação de ordenação balanceada para primeira página
      let propertiesData;
      let propertiesError;
      
      if (page === 0) {
        if (import.meta.env.DEV) {
          console.log('🔄 [MARKETPLACE] Carregando imóveis públicos - página:', page);
        }
        
        // Para primeira página: buscar mais dados para implementar round-robin
        const { data: allProperties, error } = await supabase
          .from('imoveis')
          .select(`
            id,
            title,
            type,
            reference_code,
            price,
            city,
            state,
            neighborhood,
            visibility,
            created_at,
            owner_id,
            description,
            bedrooms,
            bathrooms,
            parking,
            area_total,
            area_privativa,
            condo_fee,
            iptu,
            listing_type,
            property_type,
            latitude,
            longitude,
            vista_mar,
            distancia_mar,
            status,
            imovel_images!imovel_images_imovel_id_fkey(url, is_cover, position),
            imovel_media!imovel_media_imovel_id_fkey(url, filename, size_bytes, title, media_type, kind, position),
            imovel_features!imovel_features_imovel_id_fkey(key, value)
          `)
          .in('visibility', ['partners', 'marketplace', 'both'])
          .order('created_at', { ascending: false })
          .limit(200); // Buscar mais para fazer round-robin
          
        // Logging detalhado para diagnóstico
        console.log('🔍 [MARKETPLACE] Query executada:', {
          count: allProperties?.length || 0,
          firstId: allProperties?.[0]?.id,
          firstOwner: allProperties?.[0]?.owner_id,
          hasImages: allProperties?.[0]?.imovel_images?.length > 0,
          hasFeatures: allProperties?.[0]?.imovel_features?.length > 0,
          visibility: allProperties?.[0]?.visibility,
          error: error?.message,
          errorDetails: error
        });
        
        if (error) {
          console.error('❌ [MARKETPLACE] Erro na query:', error);
        }
        
        if (!allProperties || allProperties.length === 0) {
          console.warn('⚠️ [MARKETPLACE] Nenhum imóvel encontrado. Verifique:');
          console.warn('  1. Existem imóveis com visibility = "partners"?');
          console.warn('  2. RLS está permitindo leitura?');
          console.warn('  3. Imóveis têm is_public = true?');
        }
        
        propertiesData = allProperties;
        propertiesError = error;
        
          // Implementar ordenação balanceada se temos dados
        if (propertiesData && propertiesData.length > 0) {
          // Agrupar por owner_id
          const propertyGroups = propertiesData.reduce((acc, prop) => {
            if (!acc[prop.owner_id]) acc[prop.owner_id] = [];
            acc[prop.owner_id].push(prop);
            return acc;
          }, {} as {[key: string]: any[]});
          
          // Round-robin: alternar entre corretores
          const balancedProperties: any[] = [];
          const brokerQueues = Object.values(propertyGroups) as any[][];
          let maxLength = Math.max(...brokerQueues.map((queue: any[]) => queue.length));
          
          for (let i = 0; i < maxLength && balancedProperties.length < 50; i++) {
            for (const queue of brokerQueues) {
              if (queue[i] && balancedProperties.length < 50) {
                balancedProperties.push(queue[i]);
              }
            }
          }
          
          // Dar boost para imóveis verificados
          balancedProperties.sort((a, b) => {
            if (a.verified && !b.verified) return -1;
            if (!a.verified && b.verified) return 1;
            return 0;
          });
          
          propertiesData = balancedProperties.slice(0, 50);
        }
      } else {
        // Páginas subsequentes: paginação normal com 12 itens
        const pageSize = 12;
        const offset = (page - 1) * 50 + (page - 1) * 12; // Ajustar offset considerando primeira página maior
        
        const { data, error } = await supabase
          .from('imoveis')
          .select(`
            id,
            title,
            type,
            reference_code,
            price,
            city,
            state,
            neighborhood,
            visibility,
            created_at,
            owner_id,
            description,
            bedrooms,
            bathrooms,
            parking,
            area_total,
            area_privativa,
            condo_fee,
            iptu,
            listing_type,
            property_type,
            latitude,
            longitude,
            vista_mar,
            distancia_mar,
            status,
            imovel_images!imovel_images_imovel_id_fkey(url, is_cover, position),
            imovel_media!imovel_media_imovel_id_fkey(url, filename, size_bytes, title, media_type, kind, position),
            imovel_features!imovel_features_imovel_id_fkey(key, value)
          `)
          .in('visibility', ['partners', 'marketplace', 'both'])
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
          
        propertiesData = data;
        propertiesError = error;
      }

      if (propertiesError) {
        console.error('❌ [MARKETPLACE] Erro detalhado:', propertiesError);
        throw propertiesError;
      }

      if (!propertiesData || propertiesData.length === 0) {
        if (page === 0) {
          setProperties([]);
          setRecentProperties([]);
        }
        return;
      }

      // Get unique user IDs and fetch brokers
      const userIds: string[] = [...new Set(propertiesData.map((p: any) => p.owner_id).filter(Boolean))] as string[];
      if (userIds.length === 0) {
        if (page === 0) {
          setProperties([]);
          setRecentProperties([]);
        }
        return;
      }

      const { data: brokersData, error: brokersError } = await supabase
        .from('brokers')
        .select('user_id, id, name, avatar_url, creci, status')
        .in('user_id', userIds)
        .eq('status', 'active');

      if (brokersError) {
        console.warn('Error fetching brokers:', brokersError);
      }

      // Create lookup map and combine data with robust validation
      const brokersMap = new Map((brokersData || []).map(broker => [broker.user_id, broker]));
      const validProperties = propertiesData
        .filter(property => property && property.id && property.title) // Basic validation
        .map(property => {
          // Buscar foto de capa e todas as fotos
          const coverImage = property.imovel_images?.find((img: any) => img.is_cover)?.url;
          const allPhotos = property.imovel_images?.map((img: any) => img.url) || [];
          
          // Extrair banner_type configurado das features
          const configuredBannerType = property.imovel_features?.find((f: any) => f.key === 'banner_type')?.value;
          
          // Banner especiais apenas (sem listing_type como fallback)
          const specialBanners = ['exclusivo', 'oportunidade', 'abaixo_mercado', 'vendido', 'alugado'];
          const bannerType = (configuredBannerType && specialBanners.includes(configuredBannerType))
            ? configuredBannerType 
            : null;
          
          return {
            id: property.id,
            titulo: property.title || 'Imóvel sem título',
            reference_code: property.reference_code || property.id.slice(0, 8),
            valor: property.price || 0,
            area: property.area_total || property.area_privativa || 0,
            quartos: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            parking_spots: property.parking || 0,
            furnishing_type: 'none',
            sea_distance: property.distancia_mar || null,
            has_sea_view: property.vista_mar || false,
            fotos: allPhotos,
            videos: property.imovel_media
              ?.filter((media: any) => media.kind === 'video')
              ?.map((video: any) => ({
                type: (video.media_type || 'upload') as 'upload' | 'url',
                url: video.url,
                filename: video.filename || undefined,
                size: video.size_bytes || undefined,
                title: video.title || undefined
              })) || [],
            neighborhood: property.neighborhood || '',
            city: property.city || '',
            state: property.state || '',
            zipcode: '',
            condominium_fee: property.condo_fee || null,
            iptu: property.iptu || null,
            finalidade: property.listing_type || 'venda',
            descricao: property.description || '',
            verified: false,
            created_at: property.created_at || new Date().toISOString(),
            user_id: property.owner_id,
            owner_id: property.owner_id,
            type: property.type || 'apartment',
            listing_type: property.listing_type || 'venda',
            property_type: property.property_type || 'apartamento',
            banner_type: bannerType,
            status: property.status,
            brokers: brokersMap.get(property.owner_id) || null,
            conectaios_brokers: brokersMap.get(property.owner_id) || null
          };
        })
        .filter(property => property.titulo && property.valor); // Filter valid properties

      if (page === 0) {
        setProperties(validProperties as Property[]);
        setRecentProperties(validProperties.slice(0, 8) as Property[]);
        
        // Calculate broker stats para debug
        const stats = validProperties.reduce((acc, prop) => {
          const brokerName = prop.brokers?.name || 'Sem corretor';
          acc[brokerName] = (acc[brokerName] || 0) + 1;
          return acc;
        }, {} as {[key: string]: number});
        setBrokerStats(stats);
        
        // Cache only first page results
        localStorage.setItem(cacheKey, JSON.stringify({
          data: validProperties,
          timestamp: Date.now()
        }));
        
        console.log('📊 Marketplace Stats:', stats);
        console.log('🔄 Properties loaded:', validProperties.length);
      } else {
        // Append to existing properties for pagination
        setProperties(prev => [...prev, ...(validProperties as Property[])]);
      }
      
    } catch (error) {
      console.error('❌ [MARKETPLACE] Erro ao buscar imóveis:', error);
      console.error('❌ [MARKETPLACE] Stack:', (error as any)?.stack);
      console.error('❌ [MARKETPLACE] Detalhes:', (error as any)?.details);
      console.error('❌ [MARKETPLACE] Hint:', (error as any)?.hint);
      console.error('❌ [MARKETPLACE] Message:', (error as any)?.message);
      
      if (page === 0) {
        // Se não há dados, não mostrar erro para listas vazias
        setProperties([]);
        setRecentProperties([]);
        
        // Só mostrar toast de erro se for um erro real
        if (error && (error as any).message && !(error as any).message.includes('0 rows')) {
          toast({
            title: "Erro",
            description: "Erro ao carregar imóveis do marketplace",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Force clear ALL cached data on mount to ensure fresh visibility updates
    const clearAllCaches = () => {
      // Clear marketplace cache
      const keys = Object.keys(localStorage);
      console.log('🧹 [MARKETPLACE] Limpando cache...');
      keys.forEach(key => {
        if (key.startsWith('marketplace_properties_') || key.startsWith('minisite_')) {
          localStorage.removeItem(key);
          console.log('  ✓ Removido:', key);
        }
      });
      console.log('🧹 [MARKETPLACE] Cache limpo!');
    };
    
    clearAllCaches();
    fetchPublicProperties(0, true); // Force refresh on mount with new visibility rules
  }, [fetchPublicProperties]);

  const filteredProperties = useMemo(() => {
    let filtered = properties.filter(property => {
      const matchesSearch = property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || typeFilter === 'todos' || property.type === typeFilter;
      const matchesCategoria = !categoriaFilter || categoriaFilter === 'todos' || property.property_type === categoriaFilter;
      const matchesFinalidade = !finalidadeFilter || finalidadeFilter === 'todas' || property.listing_type === finalidadeFilter;
      const matchesMinValue = !minValue || property.valor >= parseFloat(minValue);
      const matchesMaxValue = !maxValue || property.valor <= parseFloat(maxValue);
      const matchesNeighborhood = !neighborhoodFilter || property.neighborhood?.toLowerCase().includes(neighborhoodFilter.toLowerCase());
      const matchesBedrooms = !bedroomsFilter || bedroomsFilter === 'all' || property.quartos === parseInt(bedroomsFilter);
      const matchesCity = property.city === selectedCity; // Filtro por cidade

      return matchesSearch && matchesType && matchesCategoria && matchesFinalidade && matchesMinValue && matchesMaxValue && matchesNeighborhood && matchesBedrooms && matchesCity;
    });
    
    // Se "Meus imóveis primeiro" ativado e usuário logado
    if (myPropertiesFirst && user) {
      const myProperties = filtered.filter(p => p.owner_id === user.id);
      const otherProperties = filtered.filter(p => p.owner_id !== user.id);
      filtered = [...myProperties, ...otherProperties];
    }
    
    return filtered;
  }, [properties, searchTerm, typeFilter, categoriaFilter, finalidadeFilter, minValue, maxValue, neighborhoodFilter, bedroomsFilter, myPropertiesFirst, user, selectedCity]);

  // Pagination logic com primeira página maior
  const totalItems = filteredProperties.length;
  const firstPageSize = 50;
  const subsequentPageSize = 12;
  
  const totalPages = Math.ceil(Math.max(0, totalItems - firstPageSize) / subsequentPageSize) + (totalItems > 0 ? 1 : 0);
  
  const paginatedProperties = useMemo(() => {
    if (currentPage === 1) {
      return filteredProperties.slice(0, firstPageSize);
    } else {
      const startIndex = firstPageSize + (currentPage - 2) * subsequentPageSize;
      const endIndex = startIndex + subsequentPageSize;
      return filteredProperties.slice(startIndex, endIndex);
    }
  }, [filteredProperties, currentPage, firstPageSize, subsequentPageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoriaFilter, finalidadeFilter, minValue, maxValue, neighborhoodFilter, bedroomsFilter]);

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

  // Selection handlers
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedProperties([]);
    }
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const selectAllProperties = () => {
    setSelectedProperties(paginatedProperties.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProperties([]);
  };

  const handleBulkVerification = async () => {
    if (selectedProperties.length === 0) {
      toast({
        title: "Nenhum imóvel selecionado",
        description: "Selecione pelo menos um imóvel para verificar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update properties as verified in the database
      const { error } = await supabase
        .from('imoveis')
        .update({ verified: true })
        .in('id', selectedProperties);

      if (error) {
        throw error;
      }

      toast({
        title: "Imóveis verificados com sucesso!",
        description: `${selectedProperties.length} imóvel${selectedProperties.length > 1 ? 'is' : ''} marcado${selectedProperties.length > 1 ? 's' : ''} como verificado${selectedProperties.length > 1 ? 's' : ''}.`,
      });
      
      // Refresh properties to show updated status
      await fetchPublicProperties(0);
      
      setSelectedProperties([]);
      setSelectMode(false);
    } catch (error) {
      console.error('Error verifying properties:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar imóveis para verificação.",
        variant: "destructive",
      });
    }
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
                
                {/* Seletor de Cidade */}
                <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-primary/20">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Cidade
                    </label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="h-9 border-0 bg-transparent focus:ring-1 focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label} - {city.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {filteredProperties.length}
                  </Badge>
                </div>
                
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-primary">
                  Marketplace - {getCityLabel(selectedCity)}
                </h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              Conecte-se com outros corretores e descubra oportunidades exclusivas. 
              Encontre o imóvel perfeito para seus clientes em nossa rede colaborativa.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{filteredProperties.length} imóveis disponíveis</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>Página {currentPage} de {totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>Sistema de matches</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowStats(!showStats)}
                className="text-muted-foreground hover:text-primary"
              >
                <Target className="h-4 w-4 mr-1" />
                Ver Estatísticas
              </Button>
            </div>
            
            {showStats && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Imóveis por Corretor:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.entries(brokerStats).map(([broker, count]) => (
                    <div key={broker} className="flex justify-between">
                      <span className="truncate mr-2">{broker}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                
                {/* CTA - Vender Empreendimentos */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="text-center space-y-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Quer vender empreendimentos? Clique aqui e saiba mais
                    </p>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => window.open('https://conectaios.com/vender-empreendimentos', '_blank')}
                    >
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Selection Toolbar */}
        {selectMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedProperties.length} imóvel{selectedProperties.length !== 1 ? 'is' : ''} selecionado{selectedProperties.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllProperties}
                    disabled={selectedProperties.length === paginatedProperties.length}
                  >
                    Selecionar todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedProperties.length === 0}
                  >
                    Limpar seleção
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkVerification}
                  disabled={selectedProperties.length === 0}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Marcar para verificação
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleSelectMode}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-4 bg-card rounded-lg border space-y-4"
        >
          {/* Linha 1: Busca + 3 filtros principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar imóveis..."
                value={pendingSearchTerm}
                onChange={(e) => setPendingSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            
            {/* Tipo de Imóvel */}
            <Select value={pendingTypeFilter} onValueChange={setPendingTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Imóvel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="apartment">Apartamento</SelectItem>
                <SelectItem value="land">Terreno</SelectItem>
                <SelectItem value="fazenda">Fazenda</SelectItem>
                <SelectItem value="chacara">Chácara</SelectItem>
                <SelectItem value="sitio">Sítio</SelectItem>
                <SelectItem value="cobertura">Cobertura</SelectItem>
                <SelectItem value="kitnet">Kitnet/Studio</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
                <SelectItem value="sobrado">Sobrado</SelectItem>
                <SelectItem value="loja">Loja</SelectItem>
                <SelectItem value="galpao">Galpão</SelectItem>
                <SelectItem value="predio">Prédio Comercial</SelectItem>
                <SelectItem value="sala">Sala Comercial</SelectItem>
              </SelectContent>
            </Select>

            {/* Categoria */}
            <Select value={pendingCategoriaFilter} onValueChange={setPendingCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="residencial">Residencial</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="temporada">Temporada</SelectItem>
                <SelectItem value="rural">Rural</SelectItem>
              </SelectContent>
            </Select>

            {/* Finalidade */}
            <Select value={pendingFinalidadeFilter} onValueChange={setPendingFinalidadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Finalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Linha 2: Valores + Bairro + Quartos + Botão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <Input
              placeholder="Valor mínimo"
              type="number"
              value={pendingMinValue}
              onChange={(e) => setPendingMinValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            <Input
              placeholder="Valor máximo"
              type="number"
              value={pendingMaxValue}
              onChange={(e) => setPendingMaxValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            
            <Input
              placeholder="Buscar por bairro..."
              value={pendingNeighborhoodFilter}
              onChange={(e) => setPendingNeighborhoodFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            <Select value={pendingBedroomsFilter} onValueChange={setPendingBedroomsFilter}>
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
            
            <Button 
              onClick={handleSearch}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </motion.div>
        
        {/* Selection Toolbar */}
        {selectMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-card rounded-lg border flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectMode(false);
                  setSelectedProperties([]);
                }}
              >
                Cancelar Seleção
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedProperties.length} imóveis selecionados
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => {
                // Implementar ação em massa aqui
                toast({
                  title: "Verificação iniciada",
                  description: `Verificando ${selectedProperties.length} imóveis...`,
                });
              }}
              disabled={selectedProperties.length === 0}
            >
              Verificar Selecionados
            </Button>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-between gap-4 p-4 bg-card rounded-lg border"
        >
          {/* Selection Mode Toggle */}
          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={toggleSelectMode}
            className="flex items-center gap-2"
          >
            {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {selectMode ? 'Selecionando' : 'Selecionar'}
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
            <Button
              variant={viewMode === 'icons' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('icons')}
              className="flex items-center gap-2"
            >
              <Grid2X2 className="h-4 w-4" />
              <span className="hidden sm:inline">Ícones</span>
            </Button>
          </div>
        </motion.div>

        {/* Properties - Cards View */}
        {viewMode === 'cards' && (
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
                if (selectMode) {
                  togglePropertySelection(property.id);
                } else {
                  setSelectedProperty(property);
                  setIsDetailDialogOpen(true);
                }
              }}>
                <div className="relative">
                  {/* Selection Checkbox */}
                  {selectMode && (
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => togglePropertySelection(property.id)}
                        className="bg-white/90 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                    </div>
                  )}
                  
                  {/* Property Banner */}
                  {property.banner_type && (
                    <PropertyBanner bannerType={property.banner_type} />
                  )}
                  
                  <img
                    src={property.fotos?.[0] || '/placeholder.svg'} 
                    alt={property.titulo}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
                      <Badge variant="secondary" className="text-xs">
                        {property.listing_type === 'sale' || property.listing_type === 'venda' ? 'Venda' : 
                         property.listing_type === 'rent' || property.listing_type === 'locacao' || property.listing_type === 'aluguel' ? 'Aluguel' : 
                         property.listing_type === 'season' || property.listing_type === 'temporada' ? 'Temporada' : 'Venda'}
                      </Badge>
                    </div>
                    {property.verified && (
                      <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-1">
                        <Badge variant="default" className="text-xs bg-green-500 text-white border-0">
                          ✓ Verificado
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Selection Overlay */}
                  {selectMode && selectedProperties.includes(property.id) && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <CheckSquare className="h-8 w-8 text-primary" />
                    </div>
                  )}
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
                     {property.brokers?.avatar_url ? (
                       <img 
                         src={property.brokers.avatar_url} 
                         alt={property.brokers.name}
                         className="w-6 h-6 rounded-full object-cover border border-slate-200"
                         onError={(e) => {
                           // Hide image if it fails to load and show fallback
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     ) : (
                       <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                         {property.brokers?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '👤'}
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <span>Corretor: {property.brokers?.name || property.profiles?.nome || 'Não informado'}</span>
                       {property.brokers?.creci && (
                         <span className="block text-xs text-muted-foreground/70">CRECI: {property.brokers.creci}</span>
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
                                openChatModal({
                                  id: property.id,
                                  title: property.titulo,
                                  code: property.reference_code || property.id.slice(0, 8),
                                  addressLine: property.neighborhood,
                                  city: property.city,
                                  state: property.state
                                });
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
        )}
        
        {/* Properties - List View */}
        {viewMode === 'list' && (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {paginatedProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <PropertyListView 
                  property={property}
                  onViewDetails={(prop) => {
                    setSelectedProperty(prop);
                    setIsDetailDialogOpen(true);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Properties - Icons View */}
        {viewMode === 'icons' && (
          <motion.div 
            className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {paginatedProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <PropertyIconView 
                  property={property}
                  onViewDetails={(prop) => {
                    setSelectedProperty(prop);
                    setIsDetailDialogOpen(true);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Mostrando página {currentPage} de {totalPages} • {totalItems} imóveis encontrados
              </span>
              <div className="text-sm text-muted-foreground">
                {currentPage === 1 ? `Até ${Math.min(50, totalItems)} imóveis` : `12 imóveis por página`}
              </div>
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
                            const phone = selectedProperty.brokers?.name ? '5511999999999' : '';
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

      <ChatExternalModal
        isOpen={modalOpen}
        onClose={closeChatModal}
        chatUrl={chatUrl}
      />
    </PageWrapper>
  );
}