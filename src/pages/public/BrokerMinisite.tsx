import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, MessageCircle, Building2, Bed, Bath, Car } from 'lucide-react';
import { Properties, CRM } from '@/data';
import type { Imovel, BrokerWithProfile } from '@/data';
import { toast } from 'sonner';

interface BrokerInfo {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  creci?: string;
  whatsapp?: string;
  minisite_slug?: string;
  profiles?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export default function BrokerMinisite() {
  const { slug } = useParams<{ slug: string }>();
  const [broker, setBroker] = useState<BrokerInfo | null>(null);
  const [properties, setProperties] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadBrokerAndProperties();
    }
  }, [slug]);

  const loadBrokerAndProperties = async () => {
    if (!slug) return;

    try {
      setLoading(true);

      // Find broker by minisite_slug
      const brokers = await CRM.brokers.list();
      const brokerData = brokers.find((b: BrokerWithProfile) => b.minisite_slug === slug);

      if (!brokerData) {
        toast.error('Corretor não encontrado');
        return;
      }

      setBroker({
        id: brokerData.id,
        user_id: brokerData.user_id,
        name: brokerData.profiles?.full_name || 'Corretor',
        bio: brokerData.bio || undefined,
        creci: brokerData.creci || undefined,
        whatsapp: brokerData.whatsapp || undefined,
        minisite_slug: brokerData.minisite_slug || undefined,
        profiles: brokerData.profiles || undefined
      });

      // Load broker's public properties
      const allProperties = await Properties.list({ limit: 100 });
      const brokerProperties = allProperties.filter(p => 
        p.owner_id === brokerData.user_id && 
        p.is_public === true && 
        p.visibility === 'public_site'
      );

      setProperties(brokerProperties);

    } catch (error) {
      console.error('Error loading broker minisite:', error);
      toast.error('Erro ao carregar informações do corretor');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (broker?.whatsapp) {
      const message = `Olá! Gostaria de mais informações sobre seus imóveis.`;
      const whatsappUrl = `https://wa.me/${broker.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else if (broker?.profiles?.phone) {
      const message = `Olá! Gostaria de mais informações sobre seus imóveis.`;
      const whatsappUrl = `https://wa.me/${broker.profiles.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Corretor não encontrado</h1>
          <p className="text-muted-foreground">O corretor que você procura não existe ou não está disponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-foreground text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{broker.name}</h1>
          <p className="text-xl opacity-90 mb-6">Corretor de Imóveis Especializado</p>
          
          {broker.creci && (
            <Badge variant="secondary" className="mb-6">
              CRECI: {broker.creci}
            </Badge>
          )}

          <div className="flex justify-center gap-4">
            <Button onClick={handleContact} size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Entrar em Contato
            </Button>
          </div>
        </div>
      </div>

      {/* About Section */}
      {broker.bio && (
        <div className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-center">Sobre o Corretor</h2>
            <div className="max-w-2xl mx-auto">
              <p className="text-muted-foreground leading-relaxed text-center">
                {broker.bio}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Properties Section */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Imóveis Disponíveis</h2>
          
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum imóvel disponível</h3>
              <p className="text-muted-foreground">
                Este corretor ainda não publicou imóveis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{property.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {property.price && (
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(Number(property.price))}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {property.bedrooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        {property.parking && (
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            <span>{property.parking}</span>
                          </div>
                        )}
                      </div>

                      <Badge variant={property.purpose === 'sale' ? 'default' : 'secondary'}>
                        {property.purpose === 'sale' ? 'Venda' : 'Aluguel'}
                      </Badge>

                      <Button onClick={handleContact} className="w-full">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Interesse neste imóvel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-6">Entre em Contato</h2>
          <div className="max-w-md mx-auto space-y-4">
            {broker.profiles?.email && (
              <div className="flex items-center gap-3 justify-center">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{broker.profiles.email}</span>
              </div>
            )}
            
            {(broker.whatsapp || broker.profiles?.phone) && (
              <div className="flex items-center gap-3 justify-center">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{broker.whatsapp || broker.profiles?.phone}</span>
              </div>
            )}

            <Button onClick={handleContact} size="lg" className="mt-6">
              <MessageCircle className="h-5 w-5 mr-2" />
              Falar via WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}