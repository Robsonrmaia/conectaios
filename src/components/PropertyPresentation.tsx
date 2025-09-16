import { MapPin, Calendar, Share2, Phone, Mail, MessageCircle, Copy, Building2, User, Home, Car, Bath, Bed } from 'lucide-react';
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
  const currentUrl = window.location.href;

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

  const handleShareWhatsApp = () => {
    const propertyUrl = generatePropertyUrl(property.id);
    const message = generatePropertyMessage(property, propertyUrl);
    shareToWhatsApp(message, displayBroker?.phone);
  };

  const handleCall = () => {
    const phone = displayBroker?.phone || '5511999999999';
    window.open(`tel:+55${phone.replace(/\D/g, '')}`, '_self');
  };

  const handleEmail = () => {
    const subject = `Interesse no imóvel: ${property.titulo}`;
    const body = `Olá! Tenho interesse no imóvel "${property.titulo}" no valor de ${formatCurrency(property.valor)}. Gostaria de mais informações.`;
    const email = displayBroker?.email || 'contato@conectaios.com.br';
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] overflow-y-auto">
      <div className="min-h-screen">
        {/* Header com botão fechar */}
        <div className="absolute top-4 right-4 z-10">
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white/90 hover:bg-white">
            ✕ Fechar
          </Button>
        </div>

        {/* Hero Section */}
        <div 
          className="relative h-screen flex items-end justify-center bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${property.fotos[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80'})`
          }}
        >
          {/* Property Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
            <div className="max-w-6xl mx-auto text-white">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                {/* Property Details */}
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-5xl font-bold mb-2">
                    {property.titulo}
                  </h1>
                  <p className="text-lg lg:text-xl text-gray-200 mb-4">
                    {property.neighborhood && property.city ? `${property.neighborhood}, ${property.city}` : property.neighborhood || property.city || 'Localização Premium'}
                  </p>
                  
                  {/* Property Specs */}
                  <div className="flex flex-wrap gap-4 lg:gap-6 text-sm lg:text-base">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>{property.area}m²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>{property.quartos} quartos</span>
                    </div>
                    {property.bathrooms && (
                      <div className="flex items-center gap-2">
                        <Bath className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{property.bathrooms} banheiros</span>
                      </div>
                    )}
                    {property.parking_spots && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{property.parking_spots} vagas</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Price and Actions */}
                <div className="text-right">
                  <div className="text-2xl lg:text-4xl font-bold text-green-400 mb-4">
                    {formatCurrency(property.valor)}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      size="lg" 
                      onClick={handleScheduleVisit}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Agendar Visita
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={handleShareWhatsApp}
                      className="bg-green-600 hover:bg-green-700 text-white px-6"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          
          {/* Sobre o Imóvel */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Sobre o Imóvel</h2>
            
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Especificações à esquerda */}
              <div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card p-6 rounded-lg border text-center">
                      <div className="text-2xl font-bold text-primary mb-2">{property.area}m²</div>
                      <div className="text-sm text-muted-foreground">Área Total</div>
                    </div>
                    <div className="bg-card p-6 rounded-lg border text-center">
                      <div className="text-2xl font-bold text-primary mb-2">{property.quartos}</div>
                      <div className="text-sm text-muted-foreground">Quartos</div>
                    </div>
                    {property.bathrooms && (
                      <>
                        <div className="bg-card p-6 rounded-lg border text-center">
                          <div className="text-2xl font-bold text-primary mb-2">{property.bathrooms}</div>
                          <div className="text-sm text-muted-foreground">Banheiros</div>
                        </div>
                        {property.parking_spots && (
                          <div className="bg-card p-6 rounded-lg border text-center">
                            <div className="text-2xl font-bold text-primary mb-2">{property.parking_spots}</div>
                            <div className="text-sm text-muted-foreground">Vagas</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Valores adicionais */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                      <span className="font-medium">Valor do Imóvel</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(property.valor)}</span>
                    </div>
                    {property.condominium_fee && (
                      <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                        <span className="font-medium">Condomínio</span>
                        <span className="text-sm">{formatCurrency(property.condominium_fee)}</span>
                      </div>
                    )}
                    {property.iptu && (
                      <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                        <span className="font-medium">IPTU</span>
                        <span className="text-sm">{formatCurrency(property.iptu)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Características */}
                  <div className="flex flex-wrap gap-2">
                    {property.listing_type && (
                      <Badge variant="outline" className="px-4 py-2">{property.listing_type}</Badge>
                    )}
                    {property.property_type && (
                      <Badge variant="outline" className="px-4 py-2">{property.property_type}</Badge>
                    )}
                    {property.has_sea_view && (
                      <Badge variant="outline" className="px-4 py-2">Vista para o Mar</Badge>
                    )}
                    {property.furnishing_type && property.furnishing_type !== 'none' && (
                      <Badge variant="outline" className="px-4 py-2">{property.furnishing_type}</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Planta baixa à direita */}
              <div>
                <div className="bg-card p-8 rounded-lg border h-full flex items-center justify-center">
                  <div className="text-center">
                    <img 
                      src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80" 
                      alt="Planta do Imóvel" 
                      className="w-full max-w-md mx-auto rounded-lg mb-4"
                    />
                    <h4 className="text-lg font-semibold mb-2">Planta Baixa</h4>
                    <p className="text-sm text-muted-foreground">Layout do imóvel</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Descrição do imóvel */}
            <div className="mt-12">
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  {property.descricao || 
                  `Esta magnífica residência combina elegância contemporânea com funcionalidade excepcional. 
                  Localizada em uma das áreas mais valorizadas da cidade, oferece privacidade e sofisticação 
                  em cada detalhe. Os ambientes amplos e bem iluminados proporcionam uma experiência única de moradia.`}
                </p>
              </div>
            </div>
          </section>


          {/* Localização */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Localização Privilegiada</h2>
            <p className="text-lg text-muted-foreground mb-8">
              No coração {property.neighborhood ? `do ${property.neighborhood}` : 'da região'}, próximo a tudo que você precisa
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Pontos de Interesse */}
              <div>
                <h3 className="text-xl font-bold mb-6">Pontos de Interesse</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                    <span className="font-medium">Shopping Center</span>
                    <Badge variant="secondary">1.2 km</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                    <span className="font-medium">Estação de Metrô</span>
                    <Badge variant="secondary">800 m</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                    <span className="font-medium">Hospital</span>
                    <Badge variant="secondary">2.5 km</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                    <span className="font-medium">Universidade</span>
                    <Badge variant="secondary">1.8 km</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
                    <span className="font-medium">Parque</span>
                    <Badge variant="secondary">1.5 km</Badge>
                  </div>
                </div>
              </div>
              
              {/* Mapa */}
              <div>
                <div className="bg-card rounded-lg border p-4 h-80 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="mx-auto h-12 w-12 mb-2" />
                    <p className="font-medium">{property.neighborhood || 'Localização'}</p>
                    <p className="text-sm">Mapa Interativo</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Entre em Contato */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Entre em Contato</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Agende sua visita e conheça este imóvel exclusivo
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Informações do Corretor */}
              <div className="bg-card p-8 rounded-lg border">
                {(isLoadingBroker || brokerLoading) ? (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-muted animate-pulse"></div>
                    <div className="h-6 bg-muted rounded mx-auto mb-2 w-32"></div>
                    <div className="h-4 bg-muted rounded mx-auto mb-4 w-24"></div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-muted flex items-center justify-center overflow-hidden">
                      {displayBroker?.avatar_url ? (
                        <img 
                          src={displayBroker.avatar_url} 
                          alt={displayBroker.name || 'Corretor'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {displayBroker?.name || 'Corretor Responsável'}
                    </h3>
                    {displayBroker?.creci && (
                      <p className="text-sm text-muted-foreground mb-1">CRECI {displayBroker.creci}</p>
                    )}
                    <p className="text-sm text-muted-foreground mb-4">Corretor de Imóveis</p>
                    
                    <div className="space-y-2 text-sm mb-6">
                      {displayBroker?.phone && (
                        <p>{displayBroker.phone}</p>
                      )}
                      {displayBroker?.email && (
                        <p>{displayBroker.email}</p>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-6">
                      <p>Segunda à Sexta: 8h às 18h</p>
                      <p>Sábados: 9h às 15h</p>
                    </div>
                    
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button size="sm" onClick={handleScheduleVisit} className="bg-green-600 hover:bg-green-700">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCall}>
                        <Phone className="h-4 w-4 mr-1" />
                        Ligar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleEmail}>
                        <Mail className="h-4 w-4 mr-1" />
                        E-mail
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Agendar Visita */}
              <div className="bg-card p-8 rounded-lg border">
                <h3 className="text-xl font-bold mb-4">Agende sua Visita</h3>
                <p className="text-muted-foreground mb-6">
                  Entre em contato conosco para agendar uma visita personalizada ao imóvel
                </p>
                <Button 
                  size="lg" 
                  onClick={handleScheduleVisit}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Solicitar Agendamento
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}