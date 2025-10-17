import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertToMediaArray, convertFromMediaArray, MediaItem } from '@/types/media';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Search, Filter, MapPin, Bath, Bed, Car, Edit, Trash2, Home, Upload, Eye, Globe, FileImage, EyeOff, Wand2, Sparkles, Volume2, Droplet, Palette, Target, Zap, ChevronDown, ChevronUp, TrendingUp, Share2, Download, BarChart3, Video, X, Link as LinkIcon } from 'lucide-react';
import { EnvioFlash } from '@/components/EnvioFlash';
import { toast } from '@/components/ui/use-toast';
import { FavoritesManager } from '@/components/FavoritesManager';
import { ShareButton } from '@/components/ShareButton';
import { formatCurrency, parseValueInput } from '@/lib/utils';
import { toDbVisibility, toDbStatus, toDbPurpose, fromDbVisibility, fromDbPurpose, getIsPublic, toNumber } from '@/lib/imoveis/fieldAdapters';
import { CacheManager } from '@/utils/cacheManager';

// Função para formatação monetária BR (mantida para compatibilidade)
const formatCurrencyBR = (n?: number | null): string => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
import { MediaUploader } from '@/components/MediaUploader';
import { PhotoOrderManager } from '@/components/PhotoOrderManager';
import { WatermarkGenerator } from '@/components/WatermarkGenerator';
import { WatermarkManager } from '@/components/WatermarkManager';
import { PropertyBanner } from '@/components/PropertyBanner';
import { PhotoEnhancer } from '@/components/PhotoEnhancer';
import { FurnitureDetector } from '@/components/FurnitureDetector';
import { MediaGallery } from '@/components/MediaGallery';
import { VirtualStaging } from '@/components/VirtualStaging';
import { CommissionCalculator } from '@/components/CommissionCalculator';
import { AIPropertyDescription } from '@/components/AIPropertyDescription';
import { PropertyIcons } from '@/components/PropertyIcons';
import { ConectaIOSImageProcessor } from '@/components/ConectaIOSImageProcessor';
import { Tour360Modal } from '@/components/Tour360Modal';
import { PropertyShareDialog } from '@/components/PropertyShareDialog';
import { PropertySubmissionModal } from '@/components/PropertySubmissionModal';
import { PropertySubmissionsList } from '@/components/PropertySubmissionsList';
import { PropertyImportModal } from '@/components/PropertyImportModal';
import { OlxPublicationButton } from '@/components/OlxPublicationButton';

import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { PropertyListSkeleton } from '@/components/ui/skeleton-property-card';
import { useGamificationIntegration } from '@/hooks/useGamificationIntegration';
import { testPropertyQualityScoring } from '@/utils/testGamification';
import { useBroker } from '@/hooks/useBroker';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { usePropertyQuality } from '@/hooks/usePropertyQuality';
import { QualityIndicator } from '@/components/QualityIndicator';
import { CITIES, DEFAULT_CITY, getCityLabel } from '@/config/cities';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { SubscriptionBlocker } from '@/components/SubscriptionBlocker';
import { usePropertyVideoUpload } from '@/hooks/usePropertyVideoUpload';

interface PropertyVideo {
  type: 'url' | 'upload';
  url: string;
  title?: string;
  thumbnail?: string;
  filename?: string;
  size?: number;
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms: number;
  suites?: number;
  parking_spots: number;
  listing_type: string;
  property_type: string;
  visibility: string;
  show_on_site?: boolean;
  descricao: string;
  fotos: string[];
  media: MediaItem[];
  videos: PropertyVideo[];
  created_at: string;
  reference_code?: string;
  banner_type?: string | null;
  is_furnished?: boolean;
  has_sea_view?: boolean;
  watermark_enabled?: boolean;
  furnishing_type?: 'none' | 'furnished' | 'semi_furnished';
  sketch_url?: string | null;
  sea_distance?: number;
  neighborhood?: string;
  zipcode?: string;
  address?: string;
  city?: string;
  state?: string;
  condominium_fee?: number;
  iptu?: number;
  year_built?: number;
  raw_cnm?: any;
  raw_vrsync?: any;
}

export default function Imoveis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { broker } = useBroker();
  const { isAdmin } = useAdminAuth();
  const { canAccessFeature, isSuspended, getBlockMessage, daysUntilExpiration } = useSubscriptionGuard();
  
  // Bloquear acesso se suspenso
  if (isSuspended) {
    return <SubscriptionBlocker 
      status="suspended"
      message={getBlockMessage()}
    />;
  }
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
  const [isAvaliationOpen, setIsAvaliationOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
  const { processPropertyEvent } = useGamificationIntegration();
  const { calculateQualityAnalysis } = usePropertyQuality();
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);
  const [processorType, setProcessorType] = useState<'enhance' | 'staging' | 'sketch'>('enhance');
  const [isEnvioFlashModalOpen, setIsEnvioFlashModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('lista');
  const [tour360Property, setTour360Property] = useState<Property | null>(null);
  const [isTour360ModalOpen, setIsTour360ModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [shareProperty, setShareProperty] = useState<Property | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const { uploadVideo, deleteVideo, isUploading: isVideoUploading } = usePropertyVideoUpload();
  
  const toggleCardExpansion = (propertyId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
    area: '',
    quartos: '',
    bathrooms: '',
    suites: '',
    parking_spots: '',
    listing_type: 'sale',
    property_type: 'apartamento',
    showOnSite: false,
    showOnMarketplace: false,
    broker_minisite_enabled: false,
    descricao: '',
    fotos: [] as string[],
    media: [] as MediaItem[],
    videos: [] as PropertyVideo[],
    address: '',
    neighborhood: '',
    city: DEFAULT_CITY, // Valor padrão: Ilhéus
    state: '',
    zipcode: '',
    condominium_fee: '',
    iptu: '',
    year_built: '',
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

  const handleSketchProcessed = async (sketchUrl: string, propertyId: string) => {
    try {
      console.log('💾 Salvando esboço no banco...', { propertyId, sketchUrl });
      
      const { error } = await supabase
        .from('imovel_features')
        .upsert({
          imovel_id: propertyId,
          key: 'sketch_url',
          value: sketchUrl
        }, {
          onConflict: 'imovel_id,key'
        });
      
      if (error) {
        console.error('❌ Erro ao salvar esboço:', error);
        throw error;
      }
      
      console.log('✅ Esboço salvo com sucesso!');
      
      setProperties(prev => prev.map(prop => 
        prop.id === propertyId 
          ? { ...prop, sketch_url: sketchUrl }
          : prop
      ));
      
      toast({
        title: "Esboço Salvo! ✨",
        description: "O esboço foi gerado e salvo no imóvel",
      });
      
      fetchProperties(pagination.currentPage, pagination.itemsPerPage, true);
      
    } catch (error) {
      console.error('❌ Erro ao salvar esboço:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar o esboço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Funções de gerenciamento de vídeos
  const addVideoUrl = () => {
    if (!videoUrlInput.trim()) {
      toast({ title: 'Digite uma URL válida', variant: 'destructive' });
      return;
    }

    // Validar se é URL do YouTube/Vimeo
    const isYoutube = /youtube\.com|youtu\.be/.test(videoUrlInput);
    const isVimeo = /vimeo\.com/.test(videoUrlInput);

    if (!isYoutube && !isVimeo) {
      toast({ 
        title: 'URL não suportada', 
        description: 'Use links do YouTube ou Vimeo',
        variant: 'destructive' 
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      videos: [
        ...prev.videos,
        {
          type: 'url' as const,
          url: videoUrlInput,
          title: `Vídeo ${prev.videos.length + 1}`
        }
      ]
    }));

    setVideoUrlInput('');
    toast({ title: 'URL de vídeo adicionada!' });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProperty) return;

    // Verificar limite de uploads
    const uploadCount = formData.videos.filter(v => v.type === 'upload').length;
    if (uploadCount >= 2) {
      toast({ 
        title: 'Limite atingido', 
        description: 'Máximo 2 vídeos via upload',
        variant: 'destructive' 
      });
      return;
    }

    try {
      const videoData = await uploadVideo(file, selectedProperty.id);
      
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, videoData]
      }));

      toast({ title: 'Vídeo adicionado com sucesso!' });
    } catch (error) {
      // Erro já tratado pelo hook
    }

    // Limpar o input
    e.target.value = '';
  };

  const removeVideo = async (index: number) => {
    const video = formData.videos[index];
    
    // Se for upload, deletar do storage
    if (video.type === 'upload' && selectedProperty) {
      try {
        await deleteVideo(selectedProperty.id, video.url);
      } catch (error) {
        // Erro já tratado
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));

    toast({ title: 'Vídeo removido!' });
  };

  const fetchProperties = useCallback(async (page = 1, pageSize = 20, forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Invalidar cache se forçado
      if (forceRefresh) {
        CacheManager.invalidatePropertyCache();
        console.log('🔄 Força refresh: cache de propriedades invalidado');
      }
      
      const startIndex = (page - 1) * pageSize;
      
      if (import.meta.env.DEV) {
        console.log('🔄 [ADMIN] Carregando imóveis do usuário:', user?.id);
      }
      
      // Query corrigida: buscar todos os campos necessários incluindo reference_code
      const { data, error, count } = await supabase
        .from('imoveis')
        .select('id,title,price,city,neighborhood,is_public,visibility,show_on_marketplace,show_on_minisite,created_at,area_total,area_built,bedrooms,bathrooms,suites,parking,distancia_mar,vista_mar,is_furnished,description,purpose,property_type,address,state,zipcode,condo_fee,iptu,status,construction_year,show_on_site,reference_code', { count: 'exact' })
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + pageSize - 1);

      if (import.meta.env.DEV) {
        console.log('📊 [ADMIN] Resultado query:', { 
          status: error ? 'error' : 'success', 
          error: error?.message, 
          count: data?.length 
        });
      }

      if (error) {
        console.error('❌ [ADMIN] Erro detalhado:', error);
        throw error;
      }
      
      // ✅ FIX: Buscar imagens e features de cada imóvel
      const propertyIds = (data || []).map(p => p.id);
      let imagesMap: Record<string, string[]> = {};
      let featuresMap: Record<string, Record<string, string>> = {};
      
      if (propertyIds.length > 0) {
        console.log('📸 [ADMIN] Buscando imagens para', propertyIds.length, 'imóveis');
        
        // Buscar imagens
        const { data: imagesData, error: imagesError } = await supabase
          .from('imovel_images')
          .select('imovel_id, url, position, is_cover')
          .in('imovel_id', propertyIds)
          .order('position', { ascending: true });
        
        if (imagesError) {
          console.error('❌ [ADMIN] Erro ao buscar imagens:', imagesError);
        } else {
          console.log('✅ [ADMIN] Imagens carregadas:', imagesData?.length);
          
          // Agrupar imagens por imovel_id com cache busting e validação de URL
          imagesData?.forEach(img => {
            if (!imagesMap[img.imovel_id]) {
              imagesMap[img.imovel_id] = [];
            }
            // ✅ Validar que é uma URL válida do storage (não base64)
            if (img.url && (img.url.startsWith('http://') || img.url.startsWith('https://')) && !img.url.startsWith('data:')) {
              imagesMap[img.imovel_id].push(img.url);
            } else {
              console.warn('⚠️ URL de imagem inválida (base64 ou formato incorreto) ignorada:', img.url?.substring(0, 50));
            }
          });
        }
        
    // Buscar features (banner_type, furnishing_type, sketch_url)
    const { data: featuresData, error: featuresError } = await supabase
      .from('imovel_features')
      .select('imovel_id, key, value')
      .in('imovel_id', propertyIds)
      .in('key', ['banner_type', 'furnishing_type', 'sketch_url']);
        
        if (featuresError) {
          console.error('❌ [ADMIN] Erro ao buscar features:', featuresError);
        } else {
          console.log('✅ [ADMIN] Features carregadas:', featuresData?.length);
          
          // Agrupar features por imovel_id
          featuresData?.forEach(feature => {
            if (!featuresMap[feature.imovel_id]) {
              featuresMap[feature.imovel_id] = {};
            }
            featuresMap[feature.imovel_id][feature.key] = feature.value;
          });
        }
      }
      
      // Map data com fotos, features e todos os dados carregados do banco
      const mappedData = (data || []).map(prop => {
        const features = featuresMap[prop.id] || {};
        const photos = imagesMap[prop.id] || [];
        const videos = [];
        const media = convertToMediaArray(photos, videos);
        
        return {
          id: prop.id,
          titulo: prop.title || 'Sem título',
          valor: prop.price || 0,
          area: prop.area_total || 0,
          quartos: prop.bedrooms || 0,
          bathrooms: prop.bathrooms || 0,
          suites: prop.suites || 0,
          parking_spots: prop.parking || 0,
          listing_type: prop.purpose || 'sale',
          property_type: prop.property_type || 'apartamento',
          visibility: prop.visibility || 'private',
          show_on_site: prop.show_on_site || false,
          show_on_marketplace: prop.show_on_marketplace || false,
          show_on_minisite: prop.show_on_minisite || false,
          fotos: photos,
          media: media,
          videos: videos,
          descricao: prop.description || '',
          reference_code: prop.reference_code || '',
        banner_type: features.banner_type || 'none',
        furnishing_type: (features.furnishing_type || (prop.is_furnished ? 'furnished' : 'none')) as 'none' | 'furnished' | 'semi_furnished',
        sketch_url: features.sketch_url || null,
        sea_distance: prop.distancia_mar || null,
          has_sea_view: prop.vista_mar || false,
          neighborhood: prop.neighborhood || '',
          city: prop.city || '',
          address: prop.address || '',
          state: prop.state || '',
          zipcode: prop.zipcode || '',
          condominium_fee: prop.condo_fee || null,
          iptu: prop.iptu || null,
          is_furnished: prop.is_furnished || false,
          watermark_enabled: true,
          year_built: prop.construction_year || null,
          created_at: prop.created_at,
          status: prop.status || 'available'
        };
      });
      
      console.log('📊 [ADMIN] Propriedades mapeadas com fotos:', mappedData.map(p => ({ id: p.id, fotos: p.fotos.length })));
      
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
      console.error('❌ [ADMIN] Erro ao buscar imóveis:', error);
      if (import.meta.env.DEV) {
        console.error('❌ [ADMIN] Detalhes do erro:', error);
      }
      
      // Se não há dados, não mostrar erro para listas vazias
      setProperties([]);
      
      // Só mostrar toast de erro se for um erro real (não lista vazia)
      if (error && (error as any).message && !(error as any).message.includes('0 rows')) {
        toast({
          title: "Erro",
          description: "Erro ao carregar imóveis",
          variant: "destructive",
        });
      }
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
      setIsLoading(true);
      
      // VALIDAÇÃO PRÉ-SALVAMENTO
      if (!formData.titulo || formData.titulo.trim() === '') {
        toast({
          title: "Erro de Validação",
          description: "O título do imóvel é obrigatório",
          variant: "destructive",
        });
        return;
      }

      // Parse values apenas uma vez
      const parsedValue = parseValueInput(formData.valor);
      const parsedArea = parseFloat(formData.area) || 0;
      const parsedQuartos = parseInt(formData.quartos) || 0;
      const parsedBathrooms = parseInt(formData.bathrooms) || 0;
      const parsedParkingSpots = parseInt(formData.parking_spots) || 0;
      const parsedCondominiumFee = formData.condominium_fee ? parseValueInput(formData.condominium_fee) : null;
      const parsedIptu = formData.iptu ? parseValueInput(formData.iptu) : null;
      const parsedSeaDistance = formData.sea_distance ? parseInt(formData.sea_distance) : null;
      
      // listing_type já vem em inglês do Select (sale, rent, season)
      const mappedPurpose = formData.listing_type || 'sale';
      
      // Validar dados numéricos
      if (parsedValue <= 0) {
        toast({
          title: "Erro de Validação", 
          description: "O valor do imóvel deve ser maior que zero",
          variant: "destructive",
        });
        return;
      }

      // Processar fotos com validação
      const photosArray = Array.isArray(formData.fotos) ? formData.fotos : [];
      
      // Calcular visibility e flags baseado nos checkboxes
      let dbVisibility: string;
      let isPublic: boolean;
      let showOnSiteDb: boolean;
      let showOnMarketplaceDb: boolean;
      let showOnMinisiteDb: boolean;
      
      if (!formData.showOnSite && !formData.showOnMarketplace) {
        // Oculto
        dbVisibility = 'private';
        isPublic = false;
        showOnSiteDb = false;
        showOnMarketplaceDb = false;
        showOnMinisiteDb = false;
      } else if (formData.showOnSite && !formData.showOnMarketplace) {
        // Apenas Site
        dbVisibility = 'public_site';
        isPublic = true;
        showOnSiteDb = true;
        showOnMarketplaceDb = false;
        showOnMinisiteDb = true; // Site público = minisite
      } else if (!formData.showOnSite && formData.showOnMarketplace) {
        // Apenas Marketplace
        dbVisibility = 'partners';
        isPublic = true;
        showOnSiteDb = false;
        showOnMarketplaceDb = true;
        showOnMinisiteDb = false;
      } else {
        // Ambos
        dbVisibility = 'partners';
        isPublic = true;
        showOnSiteDb = true;
        showOnMarketplaceDb = true;
        showOnMinisiteDb = true;
      }
      
      const dbStatus = toDbStatus('active');
      const dbPurpose = toDbPurpose(formData.listing_type);
      
      const propertyData = {
        owner_id: user.id,
        title: formData.titulo.trim(),
        price: toNumber(formData.valor),
        area_total: toNumber(formData.area),
        bedrooms: parsedQuartos,
        bathrooms: parsedBathrooms,
        suites: parseInt(formData.suites) || 0,
        parking: parsedParkingSpots,
        purpose: dbPurpose,
        property_type: formData.property_type,
        visibility: dbVisibility,
        description: formData.descricao,
        address: formData.address,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        videos: convertFromMediaArray(formData.media).videos.length > 0 ? convertFromMediaArray(formData.media).videos : [],
        condo_fee: toNumber(formData.condominium_fee),
        iptu: toNumber(formData.iptu),
        is_furnished: formData.is_furnished,
        vista_mar: formData.has_sea_view,
        distancia_mar: parsedSeaDistance,
        construction_year: parseInt(formData.year_built) || null,
        is_public: isPublic,
        status: dbStatus,
        show_on_site: showOnSiteDb,
        show_on_marketplace: showOnMarketplaceDb,
        show_on_minisite: showOnMinisiteDb
      };

      console.log('=== DADOS PREPARADOS PARA SALVAMENTO ===');
      console.log('propertyData completo:', JSON.stringify(propertyData, null, 2));

      let result;
      
      if (selectedProperty) {
        // Editar imóvel existente
        console.log('=== EDITANDO IMÓVEL EXISTENTE ===', selectedProperty.id);
        result = await supabase
          .from('imoveis') // ✅ FIX: usar 'imoveis' em vez de 'properties'
          .update(propertyData)
          .eq('id', selectedProperty.id)
          .select()
          .single();
      } else {
        // Adicionar novo imóvel - usar INSERT simples (sem external_id para cadastro manual)
        console.log('=== CRIANDO NOVO IMÓVEL ===');
        result = await supabase
          .from('imoveis') // ✅ FIX: usar 'imoveis' em vez de 'properties'
          .insert([propertyData]) // ✅ FIX: usar array e INSERT simples
          .select()
          .single();
      }

      console.log('=== RESULTADO DO SUPABASE ===');
      console.log('result.error:', result.error);
      console.log('result.data:', result.data);

      if (result.error) {
        console.error('=== ERRO DETALHADO DO SUPABASE ===');
        console.error('Error code:', result.error.code);
        console.error('Error message:', result.error.message);
        console.error('Error details:', result.error.details);
        console.error('Error hint:', result.error.hint);
        
        // ✅ FIX: mostrar erro completo do Supabase sem mascarar
        toast({
          title: "Erro ao salvar imóvel",
          description: `${result.error.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
        
        throw result.error;
      }

      if (!result.data) {
        console.error('=== NENHUM DADO RETORNADO ===');
        toast({
          title: "Erro ao salvar imóvel",
          description: "Nenhum dado foi retornado pelo servidor",
          variant: "destructive",
        });
        throw new Error('No data returned from database');
      }

      console.log('=== SALVAMENTO BEM-SUCEDIDO ===');
      console.log('Property saved successfully:', result.data);

      // ✅ FIX: Salvar imagens na tabela imovel_images após criar/editar o imóvel
      if (result.data?.id && photosArray.length > 0) {
        console.log('=== SALVANDO IMAGENS NA TABELA ===');
        console.log('Property ID:', result.data.id);
        console.log('Total de fotos:', photosArray.length);
        
        try {
          // Preparar registros de imagens
          const imageRecords = photosArray.map((url, index) => ({
            imovel_id: result.data.id,
            url: url,
            storage_path: url.includes('supabase.co/storage') ? url.split('/storage/v1/object/public/imoveis/')[1] : null,
            position: index,
            is_cover: index === 0,
            created_at: new Date().toISOString()
          }));

          console.log('📸 Registros de imagens preparados:', imageRecords);

          // Se for edição, remover imagens antigas primeiro
          if (selectedProperty) {
            const { error: deleteError } = await supabase
              .from('imovel_images')
              .delete()
              .eq('imovel_id', result.data.id);
            
            if (deleteError) {
              console.error('❌ Erro ao remover imagens antigas:', deleteError);
            } else {
              console.log('✅ Imagens antigas removidas');
            }
          }

          // Inserir novos registros de imagens
          const { data: insertedImages, error: imagesError } = await supabase
            .from('imovel_images')
            .insert(imageRecords)
            .select();

          if (imagesError) {
            console.error('❌ Erro ao salvar imagens:', imagesError);
            toast({
              title: "Aviso",
              description: "Imóvel salvo, mas houve erro ao salvar algumas imagens",
              variant: "destructive",
            });
          } else {
            console.log('✅ Imagens salvas com sucesso:', insertedImages);
          }
        } catch (imageError) {
          console.error('❌ Erro inesperado ao salvar imagens:', imageError);
        }
      }

      // ✅ Salvar banner_type e furnishing_type na tabela imovel_features
      if (result.data?.id && (formData.banner_type || formData.furnishing_type)) {
        console.log('=== SALVANDO FEATURES ADICIONAIS ===');
        
        try {
          // Remover features antigas se for edição
          if (selectedProperty) {
            await supabase
              .from('imovel_features')
              .delete()
              .eq('imovel_id', result.data.id)
              .in('key', ['banner_type', 'furnishing_type']);
          }

          // Preparar features para salvar
          const featuresToSave = [];
          if (formData.banner_type && formData.banner_type !== 'none') {
            featuresToSave.push({
              imovel_id: result.data.id,
              key: 'banner_type',
              value: formData.banner_type
            });
          }
          if (formData.furnishing_type && formData.furnishing_type !== 'none') {
            featuresToSave.push({
              imovel_id: result.data.id,
              key: 'furnishing_type',
              value: formData.furnishing_type
            });
          }

          if (featuresToSave.length > 0) {
            const { error: featuresError } = await supabase
              .from('imovel_features')
              .insert(featuresToSave);

            if (featuresError) {
              console.error('❌ Erro ao salvar features:', featuresError);
            } else {
              console.log('✅ Features salvas com sucesso:', featuresToSave);
            }
          }
        } catch (featuresError) {
          console.error('❌ Erro inesperado ao salvar features:', featuresError);
        }
      }

      // Calculate quality and show suggestions
      const qualityAnalysis = calculateQualityAnalysis(result.data);
      
      toast({
        title: "Sucesso",
        description: selectedProperty ? "Imóvel atualizado com sucesso!" : "Imóvel adicionado com sucesso!",
      });

      // Show quality suggestions if score is not perfect
      if (qualityAnalysis.score < 100) {
        setTimeout(() => {
          qualityAnalysis.suggestions.forEach((suggestion, index) => {
            setTimeout(() => {
              toast({
                title: `💡 Dica de Qualidade (${Math.round(qualityAnalysis.score)}%)`,
                description: suggestion,
                duration: 4000,
              });
            }, index * 1000);
          });
        }, 1000);
      } else {
        setTimeout(() => {
          toast({
            title: "🎉 Qualidade Perfeita!",
            description: "Seu anúncio tem 100% de qualidade! Ganhe pontos extras na gamificação!",
            duration: 4000,
          });
        }, 1000);
      }

      setIsAddDialogOpen(false);
      setSelectedProperty(null);
      setFormData({
        titulo: '',
        valor: '',
        area: '',
        quartos: '',
        bathrooms: '',
        suites: '',
        parking_spots: '',
        listing_type: 'venda',
        property_type: 'apartamento',
        showOnSite: false,
        showOnMarketplace: false,
        broker_minisite_enabled: false,
        descricao: '',
        fotos: [],
        media: [],
        videos: [],
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        zipcode: '',
        condominium_fee: '',
        iptu: '',
        commission_percentage: 5,
        commission_value: 0,
        commission_split_type: '50/50',
        commission_buyer_split: 50,
        commission_seller_split: 50,
        banner_type: 'none',
        is_furnished: false,
        has_sea_view: false,
        watermark_enabled: true,
        furnishing_type: 'none' as 'none' | 'furnished' | 'semi_furnished',
        year_built: '',
        sea_distance: '',
      });
      
      // Process gamification event
      if (result.data?.id) {
        console.log('🎮 Triggering gamification for property:', result.data.id);
        console.log('🏢 Broker ID:', broker?.id);
        
        if (broker?.id) {
          try {
            const gamificationResult = await processPropertyEvent(
              result.data.id, 
              selectedProperty ? 'updated' : 'created'
            );
            console.log('✅ Gamification result:', gamificationResult);
          } catch (gamError) {
            console.error('❌ Gamification error:', gamError);
          }
        } else {
          console.warn('⚠️ No broker ID found for gamification');
        }
      }
      
      // Invalidar cache e forçar refresh com delay maior
      CacheManager.invalidatePropertyCache();
      setTimeout(() => {
        fetchProperties(1, 20, true); // forceRefresh = true
      }, 1000); // Aumentado para 1 segundo
    } catch (error: any) {
      console.error('=== ERRO GERAL NO SALVAMENTO ===');
      console.error('Error type:', typeof error);
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Capturar erro específico do Supabase se disponível
      const errorMessage = error?.message || error?.details || 'Erro desconhecido ao salvar imóvel';
      
      toast({
        title: "Erro",
        description: selectedProperty ? 
          `Erro ao atualizar imóvel: ${errorMessage}` : 
          `Erro ao adicionar imóvel: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('imoveis') // ✅ FIX: usar 'imoveis' em vez de 'properties'
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imóvel excluído com sucesso!",
      });
      // Invalidar cache e forçar refresh
      CacheManager.invalidatePropertyCache();
      setTimeout(() => {
        fetchProperties(1, 20, true);
      }, 1000);
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir imóvel",
        variant: "destructive",
      });
    }
  };

  const updatePropertyVisibility = async (
    propertyId: string, 
    showOnSite: boolean, 
    showOnMarketplace: boolean
  ) => {
    try {
      console.log('🔄 Atualizando visibilidade:', { propertyId, showOnSite, showOnMarketplace });
      
      // Lógica de mapeamento:
      // Oculto: nenhum marcado -> private, is_public=false
      // Site apenas: site marcado -> public_site, is_public=true, show_on_site=true
      // Marketplace apenas: marketplace marcado -> partners, is_public=true, show_on_site=false
      // Ambos: ambos marcados -> partners, is_public=true, show_on_site=true
      
      let visibility: string;
      let isPublic: boolean;
      let showOnSiteDb: boolean;
      
      if (!showOnSite && !showOnMarketplace) {
        // Oculto
        visibility = 'private';
        isPublic = false;
        showOnSiteDb = false;
      } else if (showOnSite && !showOnMarketplace) {
        // Apenas Site
        visibility = 'public_site';
        isPublic = true;
        showOnSiteDb = true;
      } else if (!showOnSite && showOnMarketplace) {
        // Apenas Marketplace
        visibility = 'partners';
        isPublic = true;
        showOnSiteDb = false;
      } else {
        // Ambos
        visibility = 'partners';
        isPublic = true;
        showOnSiteDb = true;
      }
      
      const { error, data } = await supabase
        .from('imoveis')
        .update({ 
          visibility,
          is_public: isPublic,
          show_on_site: showOnSiteDb
        })
        .eq('id', propertyId)
        .eq('owner_id', user?.id)
        .select();

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Propriedade não encontrada ou não pertence ao usuário');
      }

      console.log('✅ Visibilidade atualizada:', data[0]);

      // Update local state with the database value returned
      setProperties(prev => 
        prev.map(prop => 
          prop.id === propertyId 
            ? { ...prop, visibility: data[0].visibility, is_public: data[0].is_public, show_on_site: data[0].show_on_site }
            : prop
        )
      );

      toast({
        title: "Visibilidade atualizada",
        description: "A visibilidade do imóvel foi alterada com sucesso.",
      });

      // Refresh properties to ensure consistency
      setTimeout(() => {
        fetchProperties(1);
      }, 500);
    } catch (error: any) {
      console.error('❌ Error updating visibility:', error);
      
      const errorMessage = error?.message || 'Erro desconhecido';
      toast({
        title: "Erro ao atualizar visibilidade",
        description: `Detalhes: ${errorMessage}`,
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
            <Button 
              variant="outline"
              onClick={() => setIsSubmissionModalOpen(true)}
              className="flex items-center gap-2 h-11"
            >
              <Share2 className="h-4 w-4" />
              Formulário Proprietário
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="text-xs px-3 py-2 h-11"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Av.
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90 h-11">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Imóvel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedProperty ? 'Editar Imóvel' : 'Adicionar Novo Imóvel'}</DialogTitle>
                <DialogDescription>
                  {selectedProperty ? 'Atualize as informações do imóvel' : 'Preencha as informações do imóvel'}
                </DialogDescription>
              </DialogHeader>
              
              {/* Botão Envio Flash - Fora do header para não sobrepor o X */}
              <div className="flex justify-end px-6 pt-2">
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
                  <div>
                    <Label htmlFor="suites">Suítes</Label>
                    <Input
                      id="suites"
                      type="number"
                      value={formData.suites}
                      onChange={(e) => setFormData({...formData, suites: e.target.value})}
                      placeholder="0"
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
                         <SelectItem value="sale">Venda</SelectItem>
                         <SelectItem value="rent">Locação</SelectItem>
                         <SelectItem value="season">Temporada</SelectItem>
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

                {/* Cidade - OBRIGATÓRIO */}
                <div>
                  <Label htmlFor="city" className="flex items-center gap-2">
                    Cidade <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  </Label>
                  <Select 
                    value={formData.city || DEFAULT_CITY} 
                    onValueChange={(value) => setFormData({...formData, city: value})}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label} - {city.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cidade onde o imóvel está localizado
                  </p>
                </div>

                {/* CEP, Bairro, IPTU e Condomínio */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="zipcode">CEP</Label>
                            <Input
                              id="zipcode"
                              value={formData.zipcode || ''}
                              onChange={(e) => setFormData({...formData, zipcode: e.target.value})}
                              placeholder="12345-678"
                              className="h-11"
                            />
                          </div>
                          <div>
                            <Label htmlFor="neighborhood">Bairro</Label>
                            <Input
                              id="neighborhood"
                              value={formData.neighborhood}
                              onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                              placeholder="Vila Madalena"
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="year_built">Ano de Construção</Label>
                            <Input
                              id="year_built"
                              type="number"
                              value={formData.year_built || ''}
                              onChange={(e) => setFormData({...formData, year_built: e.target.value})}
                              placeholder="2020"
                              className="h-11"
                            />
                          </div>
                          <div>
                            <Label htmlFor="condominium_fee">Taxa de Condomínio (R$)</Label>
                            <Input
                              id="condominium_fee"
                              value={formData.condominium_fee}
                              onChange={(e) => setFormData({...formData, condominium_fee: e.target.value})}
                              placeholder="580,00"
                              className="h-11"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Opcional - Use formato brasileiro
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="iptu">IPTU (R$)</Label>
                            <Input
                              id="iptu"
                              value={formData.iptu}
                              onChange={(e) => setFormData({...formData, iptu: e.target.value})}
                              placeholder="1.200,00"
                              className="h-11"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Opcional - Use formato brasileiro
                            </p>
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

              <MediaUploader 
                media={formData.media}
                onMediaChange={(media) => setFormData({...formData, media})}
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

              {/* Tour 360° Generator */}
              {Array.isArray(formData.fotos) && formData.fotos.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">🎯 Tour 360°</h3>
                      <p className="text-sm text-muted-foreground">
                        Gere um tour virtual do imóvel com todas as fotos
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Criar objeto temporário com dados do formData para o Tour 360°
                        const tempProperty: Property = {
                          id: selectedProperty?.id || 'temp-id',
                          titulo: formData.titulo,
                          valor: parseFloat(formData.valor?.toString() || '0'),
                          area: parseFloat(formData.area?.toString() || '0'),
                          quartos: parseInt(formData.quartos?.toString() || '0'),
                          bathrooms: parseInt(formData.bathrooms?.toString() || '0'),
                          parking_spots: parseInt(formData.parking_spots?.toString() || '0'),
                          property_type: formData.property_type,
                          listing_type: formData.listing_type,
                          descricao: formData.descricao,
                          fotos: formData.fotos,
                          media: formData.media,
                          visibility: selectedProperty?.visibility || 'private',
                          videos: selectedProperty?.videos || [],
                          created_at: selectedProperty?.created_at || new Date().toISOString()
                        };
                        setTour360Property(tempProperty);
                        setIsTour360ModalOpen(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 border-0"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Gerar Tour 360°
                    </Button>
                  </div>
                </div>
              )}

              {/* Seção de Vídeos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Vídeos do Imóvel
                  </CardTitle>
                  <CardDescription>
                    Adicione URLs do YouTube/Vimeo (ilimitadas) ou faça upload de até 2 vídeos (100MB cada)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Lista de vídeos existentes */}
                  {formData.videos.length > 0 && (
                    <div className="space-y-2">
                      {formData.videos.map((video, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                        >
                          <Video className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {video.type === 'url' ? '📺 URL Externa' : '📤 Upload'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {video.type === 'url' ? video.url : video.filename}
                            </p>
                            {video.size && (
                              <p className="text-xs text-muted-foreground">
                                {(video.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeVideo(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar URL do YouTube/Vimeo */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Adicionar URL de Vídeo (YouTube/Vimeo)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addVideoUrl()}
                      />
                      <Button 
                        onClick={addVideoUrl}
                        disabled={!videoUrlInput.trim()}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Upload de vídeo */}
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleVideoUpload}
                      disabled={
                        isVideoUploading || 
                        !selectedProperty ||
                        formData.videos.filter(v => v.type === 'upload').length >= 2
                      }
                      className="hidden"
                      id="video-upload-input"
                    />
                    <label 
                      htmlFor="video-upload-input" 
                      className={`cursor-pointer ${
                        formData.videos.filter(v => v.type === 'upload').length >= 2 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">
                        {isVideoUploading ? 'Enviando vídeo...' : 'Fazer upload de vídeo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formData.videos.filter(v => v.type === 'upload').length >= 2
                          ? '❌ Limite de 2 vídeos via upload atingido'
                          : '✅ Máximo 100MB • MP4, WEBM ou MOV'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formData.videos.filter(v => v.type === 'upload').length}/2 vídeos enviados
                      </p>
                    </label>
                  </div>

                </CardContent>
              </Card>

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

              <div className="space-y-3">
                <Label>Visibilidade do Imóvel</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="show-on-site" className="text-sm font-medium cursor-pointer">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Mostrar no Site Público
                    </label>
                    <Switch
                      id="show-on-site"
                      checked={formData.showOnSite || false}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, showOnSite: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="show-on-marketplace" className="text-sm font-medium cursor-pointer">
                      <Eye className="h-4 w-4 inline mr-2" />
                      Mostrar no Marketplace
                    </label>
                    <Switch
                      id="show-on-marketplace"
                      checked={formData.showOnMarketplace || false}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, showOnMarketplace: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="minisite" className="text-sm font-medium cursor-pointer">
                      <Home className="h-4 w-4 inline mr-2" />
                      Mostrar no Meu Site
                    </label>
                    <Switch
                      id="minisite"
                      checked={formData.broker_minisite_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, broker_minisite_enabled: checked})}
                    />
                  </div>
                  
                  {!formData.showOnSite && !formData.showOnMarketplace && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <EyeOff className="h-3 w-3 inline mr-1" />
                      Imóvel ficará oculto (não aparece em nenhum lugar público)
                    </p>
                  )}
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
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:scale-105 transition-all duration-300 hover:ring-2 hover:ring-primary/20 hover:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Salvando...
                  </>
                ) : (
                  selectedProperty ? 'Salvar Alterações' : 'Adicionar Imóvel'
                )}
              </Button>
             </div>
           </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filters wrapped in Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Lista de Imóveis
          </TabsTrigger>
          <TabsTrigger value="envios" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Envios Pendentes
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
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
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
                    
                    {/* Property Features - Canto Superior Direito */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {/* Badge de Finalidade - PRINCIPAL */}
                      <Badge variant="default" className="text-xs font-semibold">
                        {property.listing_type === 'venda' ? 'VENDA' : 
                         property.listing_type === 'locacao' ? 'LOCAÇÃO' : 'TEMPORADA'}
                      </Badge>
                      
                      {/* Badges secundários */}
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
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg flex-1">{property.titulo}</CardTitle>
                    <QualityIndicator 
                      score={calculateQualityAnalysis(property).score}
                      suggestions={calculateQualityAnalysis(property).suggestions}
                      size="sm"
                      className="flex-shrink-0"
                      property={property}
                    />
                  </div>
                  <CardDescription>
                    {property.descricao && property.descricao.substring(0, 100)}...
                  </CardDescription>
                </div>
                {property.reference_code && (
                  <Badge variant="outline" className="text-xs ml-2">
                    {property.reference_code}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(Number(property.valor) || 0)}
              </div>
              
              {/* Optional IPTU and Condominium fees */}
              {(property.condominium_fee || property.iptu) && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {property.condominium_fee && (
                    <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                      <Building2 className="h-3 w-3" />
                      <span>Cond: {formatCurrency(property.condominium_fee)}</span>
                    </div>
                  )}
                  {property.iptu && (
                    <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                      <span className="text-xs font-semibold">IPTU</span>
                      <span>{formatCurrency(property.iptu)}</span>
                    </div>
                  )}
                </div>
              )}
              
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{property.listing_type}</Badge>
                      {property.zipcode && (
                        <span className="text-xs text-muted-foreground">CEP: {property.zipcode}</span>
                      )}
                      {property.neighborhood && (
                        <span className="text-xs text-muted-foreground">{property.neighborhood}</span>
                      )}
                    </div>
                    
                    {/* Visibility Status */}
                    {property.visibility === 'partners' ? (
                      <Badge variant="default" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        Marketplace
                      </Badge>
                    ) : property.visibility === 'public_site' ? (
                      <Badge variant="default" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        Site Público
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Oculto
                      </Badge>
                    )}
                    
                    {/* Quick Visibility Buttons */}
                    <div className="flex gap-1 mt-3 pt-3 border-t">
                      <Button
                        variant={
                          property.visibility === 'public_site' || 
                          (property.visibility === 'partners' && property.show_on_site)
                            ? 'default' 
                            : 'outline'
                        }
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => {
                          const currentShowSite = property.visibility === 'public_site' || 
                                                  (property.visibility === 'partners' && property.show_on_site);
                          const currentShowMarket = property.visibility === 'partners';
                          updatePropertyVisibility(property.id, !currentShowSite, currentShowMarket);
                        }}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Site
                      </Button>
                      <Button
                        variant={property.visibility === 'partners' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => {
                          const currentShowSite = property.visibility === 'public_site' || 
                                                  (property.visibility === 'partners' && property.show_on_site);
                          const currentShowMarket = property.visibility === 'partners';
                          updatePropertyVisibility(property.id, currentShowSite, !currentShowMarket);
                        }}
                      >
                        <Target className="h-3 w-3 mr-1" />
                        Market
                      </Button>
                      <Button
                        variant={property.visibility === 'private' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => updatePropertyVisibility(property.id, false, false)}
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        Oculto
                      </Button>
                    </div>
                   </div>
                </div>
                
                {/* Toggle Button (esquerda) e Botão OLX (direita) */}
                <div className="flex justify-between items-center mt-4 gap-2 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion(property.id)}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {expandedCards.has(property.id) ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Ocultar Ações
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Ver Ações
                      </>
                    )}
                  </Button>
                  
                  {/* Botão OLX sempre visível */}
                  <OlxPublicationButton 
                    property={{
                      id: property.id,
                      title: property.titulo,
                      olx_enabled: (property as any).olx_enabled,
                      olx_data: (property as any).olx_data
                    }}
                    onUpdate={() => fetchProperties(pagination.currentPage, pagination.itemsPerPage, true)}
                  />
                </div>
                
                {/* Collapsible Action Buttons Grid */}
                {expandedCards.has(property.id) && (
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <div className="grid grid-cols-3 gap-2">
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
                       <ShareButton
                         property={property}
                         isOwner={true}
                         isAuthorized={true}
                       />
                    </div>
                  
                    {/* Segunda linha - IA Desc, Avaliar, Qualidade */}
                    <div className="grid grid-cols-3 gap-2">
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
                          toast({
                            title: "Avaliação de Imóvel",
                            description: "Funcionalidade em desenvolvimento",
                          });
                        }}
                        title="Avaliar Imóvel"
                        className="h-8 text-xs"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Avaliar
                      </Button>
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
                    </div>
                   
                    {/* Terceira linha - Móveis, Esboço, Relatórios */}
                    <div className="grid grid-cols-3 gap-2">
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
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (property.fotos && property.fotos.length > 0) {
                            setSelectedProperty(property);
                            setProcessorType('sketch');
                            setIsProcessorOpen(true);
                          } else {
                            toast({
                              title: "Sem Fotos",
                              description: "Adicione fotos ao imóvel primeiro",
                              variant: "destructive",
                            });
                          }
                        }}
                        title="Gerar Esboço"
                        className="h-8 text-xs"
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        Esboço
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/app/relatorios-compartilhamento?property=${property.id}`)}
                        title="Ver Relatórios de Compartilhamento"
                        className="h-8 text-xs"
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Relatórios
                      </Button>
                    </div>
                   
                    {/* Quarta linha - Editar, Excluir */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Busca propriedade ATUAL do estado para garantir sincronização
                          const currentProperty = properties.find(p => p.id === property.id) || property;
                          
                          // Converter visibilidade do banco para checkboxes
                          const showOnSite = currentProperty.visibility === 'public_site' || 
                                             (currentProperty.visibility === 'partners' && currentProperty.show_on_site);
                          const showOnMarketplace = currentProperty.visibility === 'partners';
                          
                          // Preenche o formulário com os dados do imóvel selecionado
                          setFormData({
                            titulo: currentProperty.titulo,
                            valor: formatCurrencyBR(currentProperty.valor),
                            area: currentProperty.area.toString(),
                            quartos: currentProperty.quartos.toString(),
                            bathrooms: currentProperty.bathrooms.toString(),
                            parking_spots: currentProperty.parking_spots.toString(),
                            listing_type: currentProperty.listing_type,
                            property_type: currentProperty.property_type,
                            showOnSite,
                            showOnMarketplace,
                            broker_minisite_enabled: false,
                            descricao: property.descricao || '',
                            fotos: Array.isArray(property.fotos) ? property.fotos : [],
                            media: convertToMediaArray(
                              Array.isArray(property.fotos) ? property.fotos : [],
                              Array.isArray(property.videos) ? property.videos : []
                            ),
                            videos: Array.isArray(property.videos) ? property.videos : [],
                            address: property.address || '',
                            neighborhood: property.neighborhood || '',
                            city: property.city || '',
                            state: property.state || '',
                            zipcode: property.zipcode || '',
                            condominium_fee: formatCurrencyBR(property.condominium_fee),
                            iptu: formatCurrencyBR(property.iptu),
                            commission_percentage: property.listing_type === "venda" ? 5 : property.listing_type === "locacao" ? 100 : 20,
                            commission_value: 0,
                            commission_split_type: '50/50',
                            commission_buyer_split: 50,
                            commission_seller_split: 50,
                            suites: property.suites ? String(property.suites) : '',
                            banner_type: property.banner_type || 'none',
                            is_furnished: property.is_furnished || false,
                            has_sea_view: property.has_sea_view || false,
                            watermark_enabled: true,
                            furnishing_type: (property.furnishing_type as 'none' | 'furnished' | 'semi_furnished') || 'none',
                            sea_distance: property.sea_distance ? String(property.sea_distance) : '',
                            year_built: property.year_built ? String(property.year_built) : '',
                          });
                          setSelectedProperty(property);
                          setIsAddDialogOpen(true);
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
                  </div>
                )}
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
                          // Converter visibilidade do banco para checkboxes
                          const showOnSite = selectedProperty.visibility === 'public_site' || 
                                             (selectedProperty.visibility === 'partners' && selectedProperty.show_on_site);
                          const showOnMarketplace = selectedProperty.visibility === 'partners';
                          
                          // Preenche o formulário com os dados do imóvel selecionado
                           setFormData({
                             titulo: selectedProperty.titulo,
                             valor: formatCurrencyBR(selectedProperty.valor),
                             area: selectedProperty.area.toString(),
                             quartos: selectedProperty.quartos.toString(),
                             bathrooms: selectedProperty.bathrooms.toString(),
                             suites: selectedProperty.suites ? String(selectedProperty.suites) : '',
                             parking_spots: selectedProperty.parking_spots.toString(),
                             listing_type: selectedProperty.listing_type,
                             property_type: selectedProperty.property_type,
                             showOnSite,
                             showOnMarketplace,
                             broker_minisite_enabled: false,
                             descricao: selectedProperty.descricao || '',
                             fotos: Array.isArray(selectedProperty.fotos) ? selectedProperty.fotos : [],
                             media: convertToMediaArray(
                               Array.isArray(selectedProperty.fotos) ? selectedProperty.fotos : [],
                               Array.isArray(selectedProperty.videos) ? selectedProperty.videos : []
                             ),
                             videos: Array.isArray(selectedProperty.videos) ? selectedProperty.videos : [],
                             address: selectedProperty.address || '',
                             neighborhood: selectedProperty.neighborhood || '',
                             city: selectedProperty.city || '',
                             state: selectedProperty.state || '',
                             zipcode: selectedProperty.zipcode || '',
                            condominium_fee: formatCurrencyBR(selectedProperty.condominium_fee),
                            iptu: formatCurrencyBR(selectedProperty.iptu),
                             commission_percentage: 6,
                             commission_value: 0,
                             commission_split_type: '50/50',
                             commission_buyer_split: 50,
                             commission_seller_split: 50,
                             banner_type: selectedProperty.banner_type || 'none',
                             is_furnished: selectedProperty.is_furnished || false,
                             has_sea_view: selectedProperty.has_sea_view || false,
                             watermark_enabled: selectedProperty.watermark_enabled || false,
                             furnishing_type: (selectedProperty.furnishing_type as 'none' | 'furnished' | 'semi_furnished') || 'none',
                             sea_distance: selectedProperty.sea_distance ? String(selectedProperty.sea_distance) : '',
                             year_built: selectedProperty.year_built ? String(selectedProperty.year_built) : '',
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
      <MediaGallery
        media={convertToMediaArray(galleryPhotos, [])}
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
                              
                              // ⚠️ CRÍTICO: Virtual Staging - usa 'imoveis' e 'imovel_images'
                              // Nota: Campo 'fotos' não existe - usar imovel_images
                              // Opcional: salvar no banco também via imovel_images
                              supabase
                                .from('imovel_images')
                                .insert({ imovel_id: virtualStagingProperty, url: stagedUrl, position: updatedPhotos.length })
                                .then(({ error: imgError }) => {
                                  if (imgError) {
                                    console.error('Erro ao salvar imagem:', imgError);
                                  }
                                })
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
                  
                  // ⚠️ CRÍTICO: AI Description - usa tabela 'imoveis'
                  // Atualizar no banco de dados
                  supabase
                    .from('imoveis')
                    .update({ description: description })
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
              
              // Se for esboço, tratar diferente
              if (processorType === 'sketch') {
                let finalImageUrl = imageUrl;
                
                // Upload para Supabase se necessário
                if (imageUrl.startsWith('blob:') || imageUrl.includes('conectaios') || imageUrl.startsWith('data:')) {
                  console.log('Converting sketch URL to Supabase upload...');
                  
                  const response = await fetch(imageUrl);
                  if (!response.ok) {
                    throw new Error('Failed to fetch processed image');
                  }
                  
                  const blob = await response.blob();
                  const fileName = `sketch-${selectedProperty.id}-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
                  
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
                  console.log('Sketch uploaded successfully:', finalImageUrl);
                }
                
                // Salvar sketch usando a função dedicada
                await handleSketchProcessed(finalImageUrl, selectedProperty.id);
                setIsProcessorOpen(false);
                return;
              }
              
              // Para outros tipos (enhance, staging), manter lógica original
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
              
              // ⚠️ CRÍTICO: Image Upload - usar 'imovel_images' (NÃO campo 'fotos')
              // Inserir na tabela imovel_images ao invés de update fotos
              const { error } = await supabase
                .from('imovel_images')
                .insert({
                  imovel_id: selectedProperty.id,
                  url: finalImageUrl,
                  position: (selectedProperty.fotos?.length || 0)
                });

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

      {/* Tour 360 Modal */}
      <Tour360Modal
        isOpen={isTour360ModalOpen}
        onClose={() => {
          setIsTour360ModalOpen(false);
          setTour360Property(null);
        }}
        onTourGenerated={async (tourUrl: string) => {
          if (tour360Property) {
            // For now, just show success message
            // TODO: Add tour_360_url column to properties table if needed
            toast({
              title: "Tour 360° Gerado!",
              description: "O tour virtual foi gerado com sucesso.",
            });

            setIsTour360ModalOpen(false);
            setTour360Property(null);
          }
        }}
        property={tour360Property}
      />
      
        </TabsContent>
        
        <TabsContent value="envios" className="space-y-6">
          <PropertySubmissionsList onImport={() => fetchProperties(pagination.currentPage)} />
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
      
      {/* Property Submission Modal */}
      <PropertySubmissionModal 
        open={isSubmissionModalOpen} 
        onOpenChange={setIsSubmissionModalOpen}
      />

      {/* Property Import Modal */}
      <PropertyImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={() => fetchProperties(pagination.currentPage)}
      />
    </div>
  );
}