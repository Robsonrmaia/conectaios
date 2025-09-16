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

  const handleExternalTool = () => {
    const propertyUrl = generatePropertyUrl(property.id);
    window.open(propertyUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black z-[10010] overflow-hidden">
      {/* Mobile-first design replicating readdy.link exactly */}
      
      {/* Hero Image with overlays */}
      <div 
        className="relative h-full w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${property.fotos[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'})`,
        }}
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

        {/* Property info overlay - center positioned */}
        <div className="absolute inset-x-0 top-1/3 px-6 text-white space-y-6">
          {/* Title */}
          <h1 className="text-4xl font-bold leading-tight">
            {property.titulo}
          </h1>
          
          {/* Location in blue */}
          <p className="text-blue-300 text-xl font-medium">
            {property.neighborhood || property.city || 'Vila Madalena'}
          </p>
          
          {/* Property specs with icons - vertical layout like readdy */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-300">Área Construída</div>
                <div className="text-lg font-semibold">{property.area}m²</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <Bed className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-300">Dormitórios</div>
                <div className="text-lg font-semibold">
                  {property.quartos} {property.bathrooms ? 'Suítes' : 'Quartos'}
                </div>
              </div>
            </div>
            
            {property.parking_spots && property.parking_spots > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                  <Car className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-300">Garagem</div>
                  <div className="text-lg font-semibold">{property.parking_spots} Vagas</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span className="text-sm font-bold text-white">$</span>
              </div>
              <div>
                <div className="text-sm text-gray-300">Valor</div>
                <div className="text-xl font-bold">{formatCurrency(property.valor)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom buttons - exactly like readdy */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <Button 
            onClick={handleScheduleVisit}
            className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            size="lg"
          >
            Agendar Visita
          </Button>
          
          <Button 
            onClick={handleShare}
            className="w-full py-4 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2"
            size="lg"
          >
            <MessageCircle className="h-5 w-5" />
            Compartilhar
          </Button>
          
          <Button 
            onClick={handleExternalTool}
            variant="outline"
            className="w-full py-3 text-base font-medium bg-gray-600/80 hover:bg-gray-700/80 text-white border-gray-500 rounded-xl backdrop-blur-sm"
            size="lg"
          >
            Ferramenta externa integrada - Gerador de Proposta HTML
          </Button>
        </div>
      </div>
    </div>
  );
}