import { MapPin, Calendar, Share2, Phone, Mail, MessageCircle, Copy, Building2, User, Home, Car, Bath, Bed, X, ChevronLeft, ChevronDown, ShoppingBag, Train, Hospital, GraduationCap, TreePine, Lightbulb } from 'lucide-react';
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

  
  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[10010] overflow-y-auto">
      {/* Hero Section - Full screen */}
      <div className="relative h-screen w-full">
        {/* Hero Image with overlays */}
        <div 
          className="relative h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(https://hvbdeyuqcliqrmzvyciq.supabase.co/storage/v1/object/public/property-images/iagocomsombra.png)`,
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
                  <span className="text-sm font-bold text-white">R$</span>
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
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-white/70" />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white">
        {/* Sobre o Imóvel Section */}
        <section className="px-6 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Sobre o Imóvel</h2>
          
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            {property.descricao || "Esta magnífica residência combina elegância contemporânea com funcionalidade excepcional. Localizada em uma das áreas mais valorizadas de São Paulo, oferece privacidade e sofisticação em cada detalhe."}
          </p>

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
                  <span className="font-medium">2022</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condomínio:</span>
                  <span className="font-medium">{property.condominium_fee ? formatCurrency(property.condominium_fee) : 'R$ 850'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IPTU:</span>
                  <span className="font-medium text-blue-600">{property.iptu ? formatCurrency(property.iptu) : 'R$ 1.200'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Disponível</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floor Plan */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-center h-40 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Planta Baixa</p>
                <p className="text-sm text-gray-500">Clique para ampliar</p>
              </div>
            </div>
          </div>
        </section>

        {/* Localização Section */}
        <section className="px-6 py-12 bg-gray-50">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Localização Privilegiada</h2>
          <p className="text-gray-600 text-lg mb-8">No coração da Vila Madalena, próximo a tudo que você precisa</p>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Pontos de Interesse</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Shopping Villa-Lobos</div>
                <div className="text-sm text-gray-500">1.2 km</div>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Train className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Estação Vila Madalena</div>
                <div className="text-sm text-gray-500">800 m</div>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Hospital className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Hospital Sírio-Libanês</div>
                <div className="text-sm text-gray-500">2.5 km</div>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">PUC-SP</div>
                <div className="text-sm text-gray-500">1.8 km</div>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TreePine className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Parque Villa-Lobos</div>
                <div className="text-sm text-gray-500">1.5 km</div>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
            </div>
          </div>

          {/* Map placeholder */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Vila Madalena</p>
                <p className="text-sm text-gray-500">São Paulo - SP</p>
              </div>
            </div>
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
    </div>
  );
}