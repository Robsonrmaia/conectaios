import { MapPin, Calendar, Share2, Phone, Mail, MessageCircle, Copy, Building2, User, Home, Car, Bath, Bed, X, ChevronLeft, ChevronDown, ShoppingBag, Train, Hospital, GraduationCap, TreePine, Lightbulb, Palette, Package, Waves, Eye, ZoomIn, Trees, Dumbbell, Utensils, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useBroker } from '@/hooks/useBroker';
import { useWhatsAppMessage } from '@/hooks/useWhatsAppMessage';
import { useRealPlaces } from '@/hooks/useRealPlaces';
import { usePropertyPresentationState } from '@/hooks/usePropertyPresentationState';
import { generatePropertyUrl } from '@/lib/urls';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import RealPropertyMap from './RealPropertyMap';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ConectaIOSImageProcessor } from '@/components/ConectaIOSImageProcessor';
import { PropertyAIAssistant } from '@/components/PropertyAIAssistant';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  fotos: string[];
  sketch_url?: string | null;
  user_id?: string;
  listing_type?: string;
  property_type?: string;
  neighborhood?: string;
  city?: string;
  zipcode?: string;
  descricao?: string;
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
  condominium_fee?: number;
  iptu?: number;
  year_built?: number;
  tour_360_url?: string;
  state?: string;
  address?: string;
}

interface PropertyPresentationProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyPresentation({ property, isOpen, onClose }: PropertyPresentationProps) {
  const { broker, loading: brokerLoading } = useBroker();
  const { generatePropertyMessage, shareToWhatsApp, copyMessageToClipboard } = useWhatsAppMessage();
  const { places, loading: placesLoading } = useRealPlaces({
    zipcode: property.zipcode,
    neighborhood: property.neighborhood,
    address: property.address,
    has_sea_view: property.has_sea_view,
    sea_distance: property.sea_distance,
    furnishing_type: property.furnishing_type,
    property_type: property.property_type
  });
  
  const presentationState = usePropertyPresentationState({
    isOpen,
    hasPhotos: !!(property.fotos?.length),
    placesLoading,
    brokerLoading
  });
  const [brokerData, setBrokerData] = useState<any>(null);
  const [isLoadingBroker, setIsLoadingBroker] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // SSR safety: detect client-side mounting
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch broker data for the property owner
  useEffect(() => {
    const fetchPropertyBroker = async () => {
      if (!property.user_id) return;
      
      setIsLoadingBroker(true);
      try {
        const { data, error } = await supabase
          .from('conectaios_brokers')
          .select('*')
          .eq('user_id', property.user_id)
          .single();
        
        if (!error && data) {
          setBrokerData(data);
        }
      } catch (error) {
        console.error('Error fetching broker:', error);
      } finally {
        setIsLoadingBroker(false);
      }
    };

    fetchPropertyBroker();
  }, [property.user_id]);


  const displayBroker = brokerData || broker;

  const handleScheduleVisit = () => {
    const message = `Olá! Gostaria de agendar uma visita ao imóvel "${property.titulo}" - ${formatCurrency(property.valor)}`;
    const phone = displayBroker?.phone || '5511999999999';
    shareToWhatsApp(message, phone);
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    // Usar rota /imovel/:id que existe no App.tsx
    const presentationUrl = currentUrl.includes('/imovel/') 
      ? currentUrl 
      : `https://conectaios.com.br/imovel/${property.id}`;
    
    const brokerInfo = {
      name: displayBroker?.name || broker?.name || 'Corretor',
      phone: displayBroker?.phone || broker?.phone,
      minisite: displayBroker?.minisite_slug || displayBroker?.username || broker?.username
    };
    
    const message = generatePropertyMessage(
      {
        titulo: property.titulo,
        valor: property.valor,
        area: property.area,
        quartos: property.quartos,
        bathrooms: property.bathrooms,
        parking_spots: property.parking_spots,
        neighborhood: property.neighborhood
      } as any, 
      presentationUrl,
      brokerInfo.name,
      brokerInfo
    );
    
    if (navigator.share) {
      await navigator.share({
        title: property.titulo,
        text: message,
        // NÃO adicionar url aqui para evitar duplicação (já está na mensagem)
      });
    } else {
      shareToWhatsApp(message, displayBroker?.phone);
    }
  };

  const handleExternalTool = () => {
    const propertyUrl = generatePropertyUrl(property.id);
    window.open(propertyUrl, '_blank');
  };

  const openPhotoGallery = (photos: string[], initialIndex: number = 0) => {
    setGalleryPhotos(photos);
    setGalleryInitialIndex(initialIndex);
    setIsGalleryOpen(true);
  };

  
  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[10010] overflow-y-auto">
      {/* Hero Section - Full screen */}
      <div className="relative h-screen w-full">
        {/* Hero Image with overlays */}
        <div 
          className="relative h-full w-full bg-cover bg-center cursor-pointer property-hero-mobile"
          style={{
            backgroundImage: property.fotos && property.fotos.length > 0 
              ? `url(${property.fotos[0]})` 
              : `url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80)`,
          }}
          onClick={() => property.fotos && property.fotos.length > 0 && openPhotoGallery(property.fotos, 0)}
        >
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          
          {/* Header with back button */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* EXCLUSIVO badge - top left */}
          <div className="absolute top-20 left-4 z-10">
            <div className="bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded-full">
              EXCLUSIVO
            </div>
          </div>

          {/* Property info overlay - center positioned with compact layout */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 px-4 text-white space-y-4">
            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
              {property.titulo}
            </h1>
            
            {/* Location in blue */}
            <p className="text-blue-300 text-sm sm:text-xl font-medium">
              {property.neighborhood && property.zipcode 
                ? `${property.neighborhood} - CEP: ${property.zipcode}`
                : property.neighborhood || property.city || 'Vila Madalena'
              }
            </p>
            
            {/* Property specs with beautiful blue icons - 2x3 grid for mobile - INCREASED SIZE FOR MOBILE */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {/* Área - only if > 0 */}
              {property.area > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <Home className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Área</div>
                    <div className="text-lg sm:text-sm font-bold">{property.area}m²</div>
                  </div>
                </div>
              )}
              
              {/* Quartos - only if > 0 */}
              {property.quartos > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <Bed className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Quartos</div>
                    <div className="text-lg sm:text-sm font-bold">{property.quartos}</div>
                  </div>
                </div>
              )}
              
              {/* Banheiros - only if > 0 */}
              {(property.bathrooms || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <Bath className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Banheiros</div>
                    <div className="text-lg sm:text-sm font-bold">{property.bathrooms}</div>
                  </div>
                </div>
              )}
              
              {/* Vagas - only if > 0 */}
              {(property.parking_spots || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <Car className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Vagas</div>
                    <div className="text-lg sm:text-sm font-bold">{property.parking_spots}</div>
                  </div>
                </div>
              )}
              
              {/* Vista do Mar */}
              {property.has_sea_view && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <Waves className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Vista</div>
                    <div className="text-lg sm:text-sm font-bold">Mar</div>
                  </div>
                </div>
              )}
              
              {/* Mobiliado */}
              {property.furnishing_type && property.furnishing_type !== 'unfurnished' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <Package className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Mobiliado</div>
                    <div className="text-lg sm:text-sm font-bold">Sim</div>
                  </div>
                </div>
              )}

              {/* Distância do Mar - only if > 0 */}
              {(property.sea_distance || 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <MapPin className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Praia</div>
                    <div className="text-lg sm:text-sm font-bold">{property.sea_distance}m</div>
                  </div>
                </div>
              )}
              
              {/* Luxo/Exclusivo - only if high value */}
              {(property.valor || 0) > 2000000 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                    <Eye className="h-6 w-6 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-xs text-gray-300">Categoria</div>
                    <div className="text-lg sm:text-sm font-bold">Luxo</div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
        
        {/* Value - At the bottom of the image in blue tones */}
        <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
          <div className="flex items-center gap-3 bg-black/60 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
              <span className="text-lg font-bold text-white">R$</span>
            </div>
            <div>
              <div className="text-sm text-gray-300">Valor</div>
              <div className="text-2xl font-bold text-blue-300">{formatCurrency(property.valor)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Connected directly to image without gap */}  
      <div className="bg-white">
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:gap-4 sm:justify-center">
            <Button 
              onClick={handleScheduleVisit}
              className="py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:w-full sm:max-w-xs sm:py-4 sm:text-lg"
              size="default"
            >
              Agendar Visita
            </Button>
            
            <Button 
              onClick={handleShare}
              className="py-3 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 sm:w-full sm:max-w-xs sm:py-4 sm:text-lg"
              size="default"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white">

        {/* Photo Gallery Section */}
        <section className="px-6 py-12">
          {property.fotos && property.fotos.length > 1 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Galeria de Fotos</h3>
              <div className="grid grid-cols-3 gap-2">
                {property.fotos.slice(0, 9).map((foto, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer 
                      group hover:scale-105 transition-all duration-300 
                      hover:ring-4 hover:ring-blue-400/50 hover:shadow-2xl
                      hover:brightness-110"
                    onClick={() => openPhotoGallery(property.fotos, index)}
                  >
                    <img
                      src={foto}
                      alt={`Foto ${index + 1} do imóvel`}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                    {/* Badge "Toque para ampliar" em mobile */}
                    <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-full 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:hidden">
                      <ZoomIn className="h-3 w-3" />
                    </div>
                    {index === 8 && property.fotos.length > 9 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{property.fotos.length - 8}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two column layout for specifications */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Especificações */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Especificações</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Área Total:</span>
                  <span className="font-medium">{property.area}m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Área do Terreno:</span>
                  <span className="font-medium">{Math.round(property.area * 1.4)}m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dormitórios:</span>
                  <span className="font-medium">{property.quartos} {property.bathrooms ? 'Suítes' : 'Quartos'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Banheiros:</span>
                  <span className="font-medium">{property.bathrooms || property.quartos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vagas:</span>
                  <span className="font-medium">{property.parking_spots || 2}</span>
                </div>
              </div>
            </div>

            {/* Informações */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Informações</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ano:</span>
                  <span className="font-medium">{property.year_built || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condomínio:</span>
                  <span className="font-medium">
                    {property.condominium_fee ? formatCurrency(property.condominium_fee) : 'Não informado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IPTU:</span>
                  <span className="font-medium text-blue-600">
                    {property.iptu ? formatCurrency(property.iptu) : 'Não informado'}
                  </span>
                </div>
                {property.zipcode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CEP:</span>
                    <span className="font-medium">{property.zipcode}</span>
                  </div>
                )}
                {property.neighborhood && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bairro:</span>
                    <span className="font-medium">{property.neighborhood}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Disponível</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Esboço do Imóvel - Se Disponível */}
        {property.sketch_url && (
          <section className="px-6 py-12">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="h-6 w-6 text-purple-600" />
                Esboço Artístico
              </h3>
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={property.sketch_url} 
                  alt="Esboço do imóvel" 
                  className="w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => {
                    setGalleryPhotos([property.sketch_url!]);
                    setGalleryInitialIndex(0);
                    setIsGalleryOpen(true);
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center">
                ✨ Esboço criado com tecnologia ConectAIOS
              </p>
            </div>
          </section>
        )}

        {/* Localização Section */}
        <section className="px-6 py-12 bg-gray-50">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Localização Privilegiada</h2>
          <p className="text-gray-600 text-lg mb-8">
            {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city || ''} - Próximo de tudo que você precisa
          </p>
          
          {/* Map Integration - Enhanced with debug logging */}
          <div className="mb-8">
            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden relative">
              {(property.zipcode || property.neighborhood || property.address) ? (
                <RealPropertyMap 
                  zipcode={property.zipcode}
                  neighborhood={property.neighborhood}
                  address={property.address}
                  city={property.city}
                  state={property.state}
                  className="animate-fade-in w-full h-full"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Mapa não disponível</p>
                    <p className="text-sm">Localização não informada</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-6 animate-fade-in">Pontos de Interesse</h3>
          
          <div className="space-y-4 mb-8">
            {placesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              places.map((place, index) => {
                const IconComponent = getPlaceIcon(place.icon);
                return (
                  <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{place.name}</div>
                      <div className="text-sm text-gray-500">{place.distance}</div>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Entre em Contato Section */}
        <section className="px-6 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Entre em Contato</h2>
          <p className="text-gray-600 text-lg mb-8">Agende sua visita e conheça este imóvel exclusivo</p>
          
          {/* Broker info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              {displayBroker?.avatar_url ? (
                <img src={displayBroker.avatar_url} alt={displayBroker.name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{displayBroker?.name || 'Ricardo Silva'}</h3>
              <p className="text-gray-600">CRECI 123.456-F</p>
              <p className="text-gray-500">15 anos de experiência</p>
            </div>
          </div>

          {/* Professional tip */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Dica Profissional</h4>
                <p className="text-blue-800">
                  Esta propriedade está em uma localização estratégica com alta valorização. 
                  Agende sua visita hoje mesmo!
                </p>
              </div>
            </div>
          </div>

          {/* Contact buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleScheduleVisit}
              className="w-full py-4 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2"
              size="lg"
            >
              <MessageCircle className="h-5 w-5" />
              Conversar no WhatsApp
            </Button>
            
            <Button 
              onClick={() => {
                const phone = displayBroker?.phone || '5511999999999';
                window.open(`tel:${phone}`, '_self');
              }}
              className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2"
              size="lg"
            >
              <Phone className="h-5 w-5" />
              Ligar Agora
            </Button>
            
            <Button 
              onClick={() => {
                const email = displayBroker?.email || 'contato@conectaios.com.br';
                window.open(`mailto:${email}`, '_self');
              }}
              className="w-full py-4 text-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white rounded-xl flex items-center justify-center gap-2"
              size="lg"
            >
              <Mail className="h-5 w-5" />
              Enviar E-mail
            </Button>
          </div>

          {/* Info sobre o botão de compartilhar */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              💡 Use o botão verde "Compartilhar" no topo da página para enviar esta proposta aos seus clientes via WhatsApp
            </p>
          </div>
        </section>

        {/* Agende sua Visita Section */}
        <section className="px-6 py-12 bg-gray-50">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Agende sua Visita</h3>
            <p className="text-gray-600 mb-6">
              Entre em contato conosco para agendar uma visita personalizada ao imóvel
            </p>
            <Button 
              onClick={handleScheduleVisit}
              className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              size="lg"
            >
              Solicitar Agendamento
            </Button>
          </div>
        </section>
      </div>

      {/* Photo Gallery */}
      <PhotoGallery
        photos={property.fotos && property.fotos.length > 0 ? [property.fotos[0], ...property.fotos.slice(1)] : []}
        initialIndex={galleryInitialIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Assistente Virtual AI - Usando portal para garantir position fixed correto */}
      {isMounted && createPortal(
        <PropertyAIAssistant property={{
          id: property.id,
          title: property.titulo,
          price: property.valor,
          area: property.area,
          bedrooms: property.quartos,
          bathrooms: property.bathrooms,
          parking: property.parking_spots,
          neighborhood: property.neighborhood,
          city: property.city,
          description: property.descricao,
          purpose: property.listing_type,
          type: property.property_type,
          owner_id: property.user_id || ''
        }} />,
        document.body
      )}
    </div>
  );
}

// Helper function to get the appropriate icon component
function getPlaceIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    ShoppingBag,
    Train,
    Hospital,
    GraduationCap,
    TreePine,
    Waves,
    MapPin: Building2, // fallback for generic places
  };
  
  return iconMap[iconName] || Building2;
}