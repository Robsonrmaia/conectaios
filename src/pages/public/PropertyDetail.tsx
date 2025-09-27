import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShareButton } from '@/components/ShareButton';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import PropertyMap from '@/components/PropertyMap';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Car, 
  Home,
  DollarSign,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Share
} from 'lucide-react';
import { Properties } from '@/data';
import { supabase } from '@/integrations/supabase/client';

interface PropertyData {
  id: string;
  title: string;
  description?: string;
  type?: string;
  purpose: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  suites?: number;
  parking?: number;
  area_total?: number;
  area_built?: number;
  city?: string;
  state?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  zipcode?: string;
  condo_fee?: number;
  is_furnished?: boolean;
  status?: string;
  visibility?: string;
  is_public?: boolean;
  owner_id: string;
  images?: Array<{
    id: string;
    url: string;
    is_cover: boolean;
    position: number;
  }>;
  features?: Array<{
    key: string;
    value: string;
  }>;
}

interface BrokerData {
  id: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  creci?: string;
  whatsapp?: string;
  email?: string;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [broker, setBroker] = useState<BrokerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Contact form states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  const fetchPropertyAndBroker = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch property using unified data layer
      const propertyData = await Properties.byId(id);
      
      if (!propertyData || !propertyData.is_public || propertyData.visibility !== 'public_site') {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProperty(propertyData);

      // Fetch broker information
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select(`
          id,
          creci,
          bio,
          whatsapp,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('user_id', propertyData.owner_id)
        .maybeSingle();

      if (brokerError) {
        console.error('Error fetching broker:', brokerError);
      }

      if (brokerData) {
        setBroker({
          id: brokerData.id,
          name: brokerData.profiles?.full_name,
          bio: brokerData.bio,
          avatar_url: brokerData.profiles?.avatar_url,
          creci: brokerData.creci,
          whatsapp: brokerData.whatsapp,
          email: brokerData.profiles?.email
        });
      }

    } catch (error) {
      console.error('Error fetching property:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyAndBroker();
  }, [id]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !broker) return;

    setContactLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          message: contactMessage,
          broker_id: broker.id,
          imovel_id: property.id,
          source: 'property_detail'
        });

      if (error) throw error;

      toast.success('Mensagem enviada com sucesso!');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch (error) {
      console.error('Error sending contact:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setContactLoading(false);
    }
  };

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === property.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-8">Imóvel não encontrado ou não está mais disponível</p>
          <Button onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const currentImage = property.images?.[currentImageIndex];
  const hasImages = property.images && property.images.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.share?.({ url: window.location.href, title: property.title })}
              >
                <Share className="w-4 h-4" />
              </Button>
              {broker?.whatsapp && (
                <WhatsAppButton
                  phone={broker.whatsapp}
                  message={`Olá! Tenho interesse no imóvel: ${property.title}`}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {hasImages ? (
                  <div className="relative">
                    <img
                      src={currentImage?.url}
                      alt={property.title}
                      className="w-full h-96 object-cover"
                    />
                    {property.images!.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {property.images!.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-96 bg-muted flex items-center justify-center">
                    <Home className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}

                {/* Thumbnail strip */}
                {property.images && property.images.length > 1 && (
                  <div className="p-4">
                    <div className="flex space-x-2 overflow-x-auto">
                      {property.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex 
                              ? 'border-primary' 
                              : 'border-transparent'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`${property.title} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                    {(property.neighborhood || property.city) && (
                      <p className="text-muted-foreground flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  {property.price && (
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        R$ {property.price.toLocaleString('pt-BR')}
                      </p>
                      {property.purpose === 'rent' && (
                        <p className="text-sm text-muted-foreground">por mês</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {property.bedrooms && (
                    <div className="flex items-center space-x-2">
                      <Bed className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        {property.bedrooms} {property.bedrooms === 1 ? 'quarto' : 'quartos'}
                      </span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center space-x-2">
                      <Bath className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        {property.bathrooms} {property.bathrooms === 1 ? 'banheiro' : 'banheiros'}
                      </span>
                    </div>
                  )}
                  {property.area_total && (
                    <div className="flex items-center space-x-2">
                      <Square className="w-5 h-5 text-primary" />
                      <span className="text-sm">{property.area_total}m²</span>
                    </div>
                  )}
                  {property.parking && (
                    <div className="flex items-center space-x-2">
                      <Car className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        {property.parking} {property.parking === 1 ? 'vaga' : 'vagas'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="secondary">{property.type || 'Imóvel'}</Badge>
                  <Badge variant="outline">
                    {property.purpose === 'sale' ? 'Venda' : 'Aluguel'}
                  </Badge>
                  {property.is_furnished && (
                    <Badge variant="outline">Mobiliado</Badge>
                  )}
                  {property.suites && property.suites > 0 && (
                    <Badge variant="outline">{property.suites} suíte{property.suites > 1 ? 's' : ''}</Badge>
                  )}
                </div>

                {/* Description */}
                {property.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {property.description}
                    </div>
                  </div>
                )}

                {/* Additional Costs */}
                {property.condo_fee && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Custos Adicionais</h3>
                    <p className="text-sm">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Condomínio: R$ {property.condo_fee.toLocaleString('pt-BR')}/mês
                    </p>
                  </div>
                )}

                {/* Features */}
                {property.features && property.features.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Características</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {property.features.map((feature, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          • {feature.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            {(property.street || property.neighborhood || property.city) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Localização</h3>
                  <div className="h-80 rounded-lg overflow-hidden">
                    <PropertyMap
                      address={[
                        property.street,
                        property.number,
                        property.neighborhood,
                        property.city,
                        property.state
                      ].filter(Boolean).join(', ')}
                    />
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    {[
                      property.street && property.number ? `${property.street}, ${property.number}` : property.street,
                      property.neighborhood,
                      property.city,
                      property.state
                    ].filter(Boolean).join(', ')}
                    {property.zipcode && ` - CEP: ${property.zipcode}`}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Broker Info */}
            {broker && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Corretor Responsável</h3>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    {broker.avatar_url ? (
                      <img
                        src={broker.avatar_url}
                        alt={broker.name || 'Corretor'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-lg font-semibold">
                          {broker.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{broker.name || 'Corretor'}</p>
                      {broker.creci && (
                        <p className="text-sm text-muted-foreground">CRECI: {broker.creci}</p>
                      )}
                    </div>
                  </div>

                  {broker.bio && (
                    <p className="text-sm text-muted-foreground mb-4">{broker.bio}</p>
                  )}

                  <div className="space-y-2">
                    {broker.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <a 
                          href={`mailto:${broker.email}`} 
                          className="text-sm hover:underline"
                        >
                          {broker.email}
                        </a>
                      </div>
                    )}
                    {broker.whatsapp && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <a 
                          href={`tel:${broker.whatsapp}`} 
                          className="text-sm hover:underline"
                        >
                          {broker.whatsapp}
                        </a>
                      </div>
                    )}
                  </div>

                  {broker.whatsapp && (
                    <WhatsAppButton
                      phone={broker.whatsapp}
                      message={`Olá! Tenho interesse no imóvel: ${property.title}`}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Form */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">
                  <MessageCircle className="inline w-5 h-5 mr-2" />
                  Solicitar Informações
                </h3>
                
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <Input
                    placeholder="Seu nome completo"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Seu melhor email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Seu telefone (com DDD)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <Textarea
                    placeholder={`Tenho interesse no imóvel "${property.title}". Gostaria de mais informações.`}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={contactLoading}
                  >
                    {contactLoading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Seus dados estão protegidos e serão utilizados apenas para este contato.
                </p>
              </CardContent>
            </Card>

            {/* Property Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Resumo do Imóvel</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Código:</span>
                    <span>{property.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{property.type || 'Imóvel'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Finalidade:</span>
                    <span>{property.purpose === 'sale' ? 'Venda' : 'Aluguel'}</span>
                  </div>
                  {property.area_built && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área construída:</span>
                      <span>{property.area_built}m²</span>
                    </div>
                  )}
                  {property.area_total && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área total:</span>
                      <span>{property.area_total}m²</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}