import { MapPin, Calendar, Share2, Phone, Mail, MessageCircle, Copy, Building2, User, Home, Car, Bath, Bed, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useBroker } from '@/hooks/useBroker';
import { useWhatsAppMessage } from '@/hooks/useWhatsAppMessage';
import { generatePropertyUrl } from '@/lib/urls';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  fotos: string[];
  user_id?: string;
  listing_type?: string;
  property_type?: string;
  neighborhood?: string;
  city?: string;
  descricao?: string;
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
  condominium_fee?: number;
  iptu?: number;
}

interface PropertyPresentationProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyPresentation({ property, isOpen, onClose }: PropertyPresentationProps) {
  const { broker, loading: brokerLoading } = useBroker();
  const { generatePropertyMessage, shareToWhatsApp, copyMessageToClipboard } = useWhatsAppMessage();
  const [brokerData, setBrokerData] = useState<any>(null);
  const [isLoadingBroker, setIsLoadingBroker] = useState(false);

  if (!isOpen) return null;

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
    const propertyUrl = generatePropertyUrl(property.id);
    const message = generatePropertyMessage(property, propertyUrl);
    
    if (navigator.share) {
      await navigator.share({
        title: property.titulo,
        text: message,
        url: propertyUrl,
      });
    } else {
      await copyMessageToClipboard(message);
      toast({
        title: "Mensagem copiada!",
        description: "A mensagem foi copiada para a área de transferência",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[10010] overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}>
      {/* Mobile-first design replicating readdy.link exactly */}
      
      {/* Hero Image with overlays */}
      <div 
        className="relative h-full w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${property.fotos[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        
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
        <div className="absolute top-16 left-4 z-10">
          <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-bold">
            EXCLUSIVO
          </Badge>
        </div>

        {/* Property info overlay - center */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 text-white">
          {/* Title */}
          <h1 className="text-3xl font-bold mb-2 leading-tight">
            {property.titulo}
          </h1>
          
          {/* Location in blue */}
          <p className="text-blue-400 text-lg font-medium mb-6">
            {property.neighborhood || 'Vila Madalena'}
          </p>
          
          {/* Property specs with icons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-2 backdrop-blur-sm">
              <Home className="h-4 w-4" />
              <span className="text-sm font-medium">{property.area}m²</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-2 backdrop-blur-sm">
              <Bed className="h-4 w-4" />
              <span className="text-sm font-medium">{property.quartos} dormitórios</span>
            </div>
            {property.parking_spots && property.parking_spots > 0 && (
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-2 backdrop-blur-sm">
                <Car className="h-4 w-4" />
                <span className="text-sm font-medium">{property.parking_spots} garagem</span>
              </div>
            )}
          </div>
          
          {/* Price */}
          <div className="text-2xl font-bold mb-8">
            {formatCurrency(property.valor)}
          </div>
        </div>

        {/* Fixed bottom buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-3">
          <Button 
            onClick={handleScheduleVisit}
            className="flex-1 py-4 text-base font-semibold text-white"
            style={{ backgroundColor: 'hsl(var(--pastel-blue))', color: 'white' }}
            size="lg"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Agendar Visita
          </Button>
          <Button 
            onClick={handleShare}
            className="flex-1 py-4 text-base font-semibold text-white"
            style={{ backgroundColor: 'hsl(var(--pastel-green))', color: 'white' }}
            size="lg"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Compartilhar
          </Button>
        </div>
      </div>
    </div>
  );
}