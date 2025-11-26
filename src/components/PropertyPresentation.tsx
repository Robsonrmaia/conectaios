import { MapPin, Calendar, Share2, Phone, Mail, MessageCircle, Copy, Building2, User, Home, Car, Bath, Bed, X, ChevronLeft, ChevronDown, ShoppingBag, Train, Hospital, GraduationCap, TreePine, Lightbulb, Palette, Package, Waves, Eye, ZoomIn, Trees, Dumbbell, Utensils, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useBroker } from '@/hooks/useBroker';
import { useWhatsAppMessage } from '@/hooks/useWhatsAppMessage';
import { useRealPlaces } from '@/hooks/useRealPlaces';
import { usePropertyPresentationState } from '@/hooks/usePropertyPresentationState';
import { useShareTracking } from '@/hooks/useShareTracking';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Hero } from '@/components/property-presentation/Hero';
import { ActionBar } from '@/components/property-presentation/ActionBar';
import { MediaSection } from '@/components/property-presentation/MediaSection';
import { DescriptionSection } from '@/components/property-presentation/DescriptionSection';
import { SpecsInfo } from '@/components/property-presentation/SpecsInfo';
import { LocationSection } from '@/components/property-presentation/LocationSection';
import { ContactSection } from '@/components/property-presentation/ContactSection';
import { ScheduleSection } from '@/components/property-presentation/ScheduleSection';
import type { Property, BrokerDisplay, PropertyVideo } from '@/components/property-presentation/types';

interface PropertyPresentationProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyPresentation({ property, isOpen, onClose }: { property: Property; isOpen: boolean; onClose: () => void; }) {
  const { broker, loading: brokerLoading } = useBroker();
  const { generatePropertyMessage, shareToWhatsApp } = useWhatsAppMessage();
  const { generateTrackableLink, recordView, recordInteraction } = useShareTracking();
  const { places, loading: placesLoading } = useRealPlaces({
    zipcode: property.zipcode,
    neighborhood: property.neighborhood,
    address: property.address,
    city: property.city,
    state: property.state,
    latitude: property.latitude,
    longitude: property.longitude,
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

  const [brokerData, setBrokerData] = useState<BrokerDisplay | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Registrar visualização quando abrir a apresentação com shareId na URL
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('share');
      if (shareId) {
        recordView(shareId);
      }
    }
  }, [isOpen, recordView]);

  // Fetch broker data for the property owner
  useEffect(() => {
    const fetchPropertyBroker = async () => {
      if (!property.user_id) return;
      const { data, error } = await supabase
        .from('conectaios_brokers')
        .select('*')
        .eq('user_id', property.user_id)
        .single();
      if (!error && data) {
        setBrokerData(data as BrokerDisplay);
      }
    };
    fetchPropertyBroker();
  }, [property.user_id]);

  const displayBroker = brokerData || broker;

  const handleScheduleVisit = () => {
    const message = `Olá! Gostaria de agendar uma visita ao imóvel "${property.titulo}" - ${formatCurrency(property.valor)}`;
    const phone = displayBroker?.phone || '5511999999999';
    shareToWhatsApp(message, phone);

    // Registrar interação
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('share');
      if (shareId) {
        recordInteraction(shareId, 'schedule_visit_clicked');
      }
    }
  };

  const handleShare = async () => {
    try {
      if (broker) {
        const trackingData = await generateTrackableLink(property.id, 'whatsapp');
        if (!trackingData) {
          toast({ title: 'Erro ao gerar link de compartilhamento', variant: 'destructive' });
          return;
        }
        const { trackableUrl } = trackingData;
        const brokerInfo = {
          name: displayBroker?.name || broker?.name || 'Corretor',
          phone: displayBroker?.phone || broker?.phone,
          minisite: (displayBroker as BrokerDisplay)?.minisite_slug || displayBroker?.username
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
          trackableUrl,
          brokerInfo.name,
          brokerInfo
        );
        if (navigator.share) {
          await navigator.share({ title: property.titulo, text: message });
        } else {
          shareToWhatsApp(message, displayBroker?.phone);
        }
      } else {
        const propertyUrl = `${window.location.origin}/imovel/${property.id}`;
        if (navigator.share) {
          await navigator.share({
            title: property.titulo,
            text: `Confira este imóvel: ${property.titulo} - ${formatCurrency(property.valor)}`,
            url: propertyUrl
          });
          toast({ title: 'Compartilhado!', description: 'Imóvel compartilhado com sucesso' });
        } else {
          await navigator.clipboard.writeText(propertyUrl);
          toast({ title: 'Link copiado!', description: 'Cole o link onde desejar compartilhar' });
        }
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast({ title: 'Erro ao compartilhar imóvel', variant: 'destructive' });
    }
  };

  const openPhotoGallery = (photos: string[], initialIndex: number = 0) => {
    setGalleryPhotos(photos);
    setGalleryInitialIndex(initialIndex);
    setIsGalleryOpen(true);

    // Registrar interação
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('share');
      if (shareId) {
        recordInteraction(shareId, 'photo_gallery_opened', { photoIndex: initialIndex });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[10010] overflow-y-auto">
      <Hero property={property} displayBroker={displayBroker as BrokerDisplay} onClose={onClose} openPhotoGallery={openPhotoGallery} />
      <ActionBar onScheduleVisit={handleScheduleVisit} onShare={handleShare} />
      <div className="bg-white">
        <MediaSection property={property} openPhotoGallery={openPhotoGallery} />
        <DescriptionSection descricao={property.descricao} />
        <SpecsInfo property={property} />
        <LocationSection property={property} places={places as any} placesLoading={placesLoading} />
        <ContactSection displayBroker={displayBroker as BrokerDisplay} onScheduleVisit={handleScheduleVisit} />
        <ScheduleSection onScheduleVisit={handleScheduleVisit} />
      </div>
      <PhotoGallery
        photos={property.fotos && property.fotos.length > 0 ? [property.fotos[0], ...property.fotos.slice(1)] : []}
        initialIndex={galleryInitialIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  );
}