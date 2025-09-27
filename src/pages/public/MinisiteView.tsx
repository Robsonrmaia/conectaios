import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCard } from '@/components/AnimatedCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { MapPin, Bed, Bath, Square, Phone, Mail, MessageCircle, Share, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Simple data structures to avoid type recursion
interface MinisiteConfig {
  id: string;
  user_id: string;
  title: string;
  primary_color: string;
  secondary_color: string;
  show_properties: boolean;
  show_contact: boolean;
  show_about: boolean;
  custom_domain?: string;
  description?: string;
  phone?: string;
  email?: string;
  custom_message?: string;
  generated_url?: string;
  is_active?: boolean;
}

interface BrokerData {
  id: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  creci?: string;
  whatsapp?: string;
}

interface SimpleProperty {
  id: string;
  titulo: string;
  valor?: number;
  quartos?: number;
  banheiros?: number;
  area_total?: number;
  cidade?: string;
  bairro?: string;
  tipo?: string;
  finalidade: string;
  is_public: boolean;
  visibility: string;
  fotos?: string[];
  capa?: string;
}

export default function MinisiteView() {
  const { username } = useParams<{ username: string }>();
  const [config, setConfig] = useState<MinisiteConfig | null>(null);
  const [broker, setBroker] = useState<BrokerData | null>(null);
  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<SimpleProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedListingType, setSelectedListingType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBedrooms, setSelectedBedrooms] = useState('all');
  
  // Contact form states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  const fetchMinisiteData = async () => {
    if (!username) return;

    setLoading(true);
    console.log('Fetching minisite for username:', username);

    try {
      let urlToFind = `https://conectaios.lovableproject.com/minisite/${username}`;
      console.log('Looking for URL:', urlToFind);
      
      // Fetch minisite config first with basic columns only
      const { data: configData, error: configError } = await supabase
        .from('minisite_configs')
        .select('id, user_id, title, primary_color, secondary_color, show_properties, show_contact, show_about, custom_domain, phone, email, custom_message, generated_url, is_active')
        .eq('generated_url', urlToFind)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Config data:', configData);
      console.log('Config error:', configError);

      if (configError) {
        console.error('Error fetching minisite config:', configError);
      }

      if (!configData) {
        console.log('Minisite not found for username:', username);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setConfig(configData);

      // Fetch broker data separately using correct schema
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('id, creci, bio, whatsapp')
        .eq('user_id', configData.user_id)
        .maybeSingle();

      if (brokerError) {
        console.error('Error fetching broker:', brokerError);
      }

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', configData.user_id)
        .maybeSingle();

      if (brokerData && profileData) {
        setBroker({
          id: brokerData.id,
          name: profileData.full_name,
          bio: brokerData.bio,
          avatar_url: profileData.avatar_url,
          creci: brokerData.creci,
          whatsapp: brokerData.whatsapp
        });
      }

      // Fetch properties using direct Supabase call to avoid type complexity
      if (configData?.user_id) {
        try {
          const { data: propertiesData, error: propertiesError } = await supabase
            .from('imoveis')
            .select('id, title, price, bedrooms, bathrooms, area_total, city, neighborhood, type, purpose, is_public, visibility')
            .eq('owner_id', configData.user_id)
            .eq('is_public', true)
            .eq('visibility', 'public_site')
            .limit(50);

          if (propertiesError) {
            console.error('Error fetching properties:', propertiesError);
            setProperties([]);
            setFilteredProperties([]);
          } else {
            // Transform to match expected Property interface
            const transformedProperties: SimpleProperty[] = (propertiesData || []).map(property => ({
              id: property.id,
              titulo: property.title,
              valor: property.price ? Number(property.price) : undefined,
              quartos: property.bedrooms,
              banheiros: property.bathrooms,
              area_total: property.area_total ? Number(property.area_total) : undefined,
              cidade: property.city,
              bairro: property.neighborhood,
              tipo: property.type,
              finalidade: property.purpose,
              is_public: property.is_public,
              visibility: property.visibility,
              fotos: [],
              capa: undefined
            }));

            setProperties(transformedProperties);
            setFilteredProperties(transformedProperties);
          }
        } catch (propertiesError) {
          console.error('Error fetching properties:', propertiesError);
          setProperties([]);
          setFilteredProperties([]);
        }
      }

    } catch (error) {
      console.error('Error in fetchMinisiteData:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinisiteData();
  }, [username]);

  // Filter properties based on search and filter criteria
  useEffect(() => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.bairro?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(property => property.tipo === selectedType);
    }

    // Listing type filter
    if (selectedListingType !== 'all') {
      filtered = filtered.filter(property => property.finalidade === selectedListingType);
    }

    // Price filters
    if (minPrice) {
      filtered = filtered.filter(property => {
        const price = property.valor || 0;
        return price >= parseInt(minPrice);
      });
    }

    if (maxPrice) {
      filtered = filtered.filter(property => {
        const price = property.valor || 0;
        return price <= parseInt(maxPrice);
      });
    }

    // Bedrooms filter
    if (selectedBedrooms !== 'all') {
      filtered = filtered.filter(property => property.quartos === parseInt(selectedBedrooms));
    }

    setFilteredProperties(filtered);
  }, [properties, searchTerm, selectedType, selectedListingType, minPrice, maxPrice, selectedBedrooms]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !broker) return;

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
          source: 'minisite'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando minisite...</p>
        </div>
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-8">Minisite não encontrado</p>
          <Button onClick={() => window.location.href = '/'}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {broker?.avatar_url && (
                <img
                  src={broker.avatar_url}
                  alt={broker.name || 'Corretor'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
                {config.description && (
                  <p className="text-muted-foreground">{config.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.share?.({ url: window.location.href, title: config.title })}
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* About Section */}
            {config.show_about && broker?.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Sobre</h2>
                  <p className="text-muted-foreground">{broker.bio}</p>
                  {broker.creci && (
                    <p className="text-sm text-muted-foreground mt-2">CRECI: {broker.creci}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Properties Section */}
            {config.show_properties && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Imóveis ({filteredProperties.length})</h2>
                </div>

                {/* Search and Filters */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input
                        placeholder="Buscar por título, cidade ou bairro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de imóvel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          <SelectItem value="house">Casa</SelectItem>
                          <SelectItem value="apartment">Apartamento</SelectItem>
                          <SelectItem value="commercial">Comercial</SelectItem>
                          <SelectItem value="land">Terreno</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedListingType} onValueChange={setSelectedListingType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Finalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="sale">Venda</SelectItem>
                          <SelectItem value="rent">Aluguel</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Preço mínimo"
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />

                      <Input
                        placeholder="Preço máximo"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />

                      <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
                        <SelectTrigger>
                          <SelectValue placeholder="Quartos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Qualquer quantidade</SelectItem>
                          <SelectItem value="1">1 quarto</SelectItem>
                          <SelectItem value="2">2 quartos</SelectItem>
                          <SelectItem value="3">3 quartos</SelectItem>
                          <SelectItem value="4">4+ quartos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <AnimatedCard key={property.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {property.capa && (
                          <img
                            src={property.capa}
                            alt={property.titulo}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{property.titulo}</h3>
                          
                          {property.valor && (
                            <p className="text-2xl font-bold text-primary mb-2">
                              R$ {property.valor.toLocaleString('pt-BR')}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-3">
                            {property.quartos && (
                              <Badge variant="secondary" className="text-xs">
                                <Bed className="w-3 h-3 mr-1" />
                                {property.quartos} quartos
                              </Badge>
                            )}
                            {property.banheiros && (
                              <Badge variant="secondary" className="text-xs">
                                <Bath className="w-3 h-3 mr-1" />
                                {property.banheiros} banheiros
                              </Badge>
                            )}
                            {property.area_total && (
                              <Badge variant="secondary" className="text-xs">
                                <Square className="w-3 h-3 mr-1" />
                                {property.area_total}m²
                              </Badge>
                            )}
                          </div>

                          {(property.cidade || property.bairro) && (
                            <p className="text-sm text-muted-foreground mb-3 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {property.bairro && property.cidade 
                                ? `${property.bairro}, ${property.cidade}`
                                : property.bairro || property.cidade
                              }
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigator.share?.({ 
                                url: `${window.location.origin}/property/${property.id}`, 
                                title: property.titulo 
                              })}
                            >
                              <Share className="w-4 h-4 mr-1" />
                              Compartilhar
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="flex-1"
                              onClick={() => window.open(`/property/${property.id}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </AnimatedCard>
                  ))}
                </div>

                {filteredProperties.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum imóvel encontrado com os filtros selecionados.</p>
                  </div>
                )}
              </div>
            )}

            {/* Custom Message */}
            {config.custom_message && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">{config.custom_message}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            {config.show_contact && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Contato</h3>
                  <div className="space-y-3">
                    {config.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <a href={`tel:${config.phone}`} className="text-sm hover:underline">
                          {config.phone}
                        </a>
                      </div>
                    )}
                    {config.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <a href={`mailto:${config.email}`} className="text-sm hover:underline">
                          {config.email}
                        </a>
                      </div>
                    )}
                    {broker?.whatsapp && (
                      <WhatsAppButton
                        phone={broker.whatsapp}
                        message="Olá! Vi seu minisite e gostaria de mais informações."
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Form */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Envie uma mensagem</h3>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <Input
                    placeholder="Seu nome"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Seu email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Seu telefone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <Textarea
                    placeholder="Sua mensagem"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={contactLoading}>
                    {contactLoading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            Minisite criado com ❤️ pelo ConectaIOS
          </p>
        </div>
      </footer>
    </div>
  );
}