import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCard } from '@/components/AnimatedCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  Bed, 
  Bath, 
  Car, 
  Home, 
  Search,
  Square,
  Building2
} from 'lucide-react';

interface MinisiteConfig {
  id: string;
  user_id: string;
  broker_id: string | null;
  title: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  template_id: string;
  show_properties: boolean;
  show_contact: boolean;
  show_about: boolean;
  broker_name: string;
  broker_email: string;
  broker_phone: string;
  broker_whatsapp: string;
  broker_avatar: string;
  broker_cover: string;
  broker_creci: string;
  custom_message: string;
  custom_domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area_total: number;
  photos: string[];
  neighborhood: string;
  city: string;
  state: string;
  description: string;
  type: string;
  purpose: string;
  street?: string;
  number?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export default function MinisiteView() {
  const { username } = useParams();
  const [config, setConfig] = useState<MinisiteConfig | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [minisiteNotFound, setMinisiteNotFound] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedroomsFilter, setBedroomsFilter] = useState('all');

  const fetchMinisiteData = useCallback(async () => {
    if (!username) {
      console.log('❌ [MINISITE] No username provided');
      return;
    }

    console.log('🔍 [MINISITE] Fetching minisite for username:', username);
    setLoading(true);

    try {
      // First try to fetch broker from brokers table
      let brokerData = null;
      let brokerId = null;
      let userId = null;

      const { data: primaryBroker, error: primaryError } = await supabase
        .from('brokers')
        .select('id, user_id, name, username, bio, phone, email, avatar_url, cover_url, creci, status')
        .eq('username', username)
        .eq('status', 'active')
        .maybeSingle();

      console.log('👤 [MINISITE] Primary broker query:', { primaryBroker, primaryError });

      if (primaryBroker) {
        brokerData = primaryBroker;
        brokerId = primaryBroker.id;
        userId = primaryBroker.user_id;
      } else {
        // Fallback: try conectaios_brokers view
        const { data: fallbackBroker, error: fallbackError } = await supabase
          .from('conectaios_brokers')
          .select('*')
          .ilike('name', `%${username}%`)
          .eq('status', 'active')
          .maybeSingle();

        console.log('👤 [MINISITE] Fallback broker query:', { fallbackBroker, fallbackError });

        if (fallbackBroker) {
          brokerData = fallbackBroker;
          userId = fallbackBroker.user_id;
          brokerId = fallbackBroker.id;
        }
      }

      if (!brokerData || !userId) {
        console.log('❌ [MINISITE] Broker not found');
        setMinisiteNotFound(true);
        return;
      }

      console.log('✅ [MINISITE] Broker found:', { brokerId, userId, name: brokerData.name });

      // Fetch minisite config
      const { data: configData, error: configError } = await supabase
        .from('minisite_configs')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('⚙️ [MINISITE] Config query result:', { configData, configError });

      // Merge broker data with config
      const finalConfig: MinisiteConfig = {
        id: configData?.id || '',
        user_id: userId,
        broker_id: brokerId || null,
        title: configData?.title || `${brokerData.name} - Corretor de Imóveis`,
        description: brokerData.bio || configData?.description || '',
        primary_color: configData?.primary_color || '#3B82F6',
        secondary_color: configData?.secondary_color || '#EF4444',
        template_id: configData?.template_id || 'default',
        show_properties: configData?.show_properties ?? true,
        show_contact: configData?.show_contact ?? true,
        show_about: configData?.show_about ?? true,
        broker_name: brokerData.name,
        broker_email: brokerData.email || '',
        broker_phone: brokerData.phone || '',
        broker_whatsapp: brokerData.phone || '',
        broker_avatar: brokerData.avatar_url || '',
        broker_cover: brokerData.cover_url || '',
        broker_creci: brokerData.creci || '',
        custom_message: configData?.custom_message || '',
        custom_domain: configData?.custom_domain || null,
        is_active: true,
        created_at: configData?.created_at || new Date().toISOString(),
        updated_at: configData?.updated_at || new Date().toISOString()
      };

      console.log('✅ [MINISITE] Final config:', finalConfig);
      setConfig(finalConfig);

      // Fetch properties if enabled
      if (finalConfig.show_properties) {
        console.log('🏠 [MINISITE] Fetching properties for user:', userId);
        
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('imoveis')
          .select(`
            id,
            title,
            description,
            price,
            area_total,
            bedrooms,
            bathrooms,
            parking,
            type,
            purpose,
            city,
            state,
            neighborhood,
            street,
            number,
            zipcode,
            latitude,
            longitude,
            created_at,
            imovel_images (
              id,
              url,
              is_cover,
              position
            )
          `)
          .eq('owner_id', userId)
          .eq('is_public', true)
          .in('visibility', ['public_site', 'partners'])
          .eq('status', 'available')
          .order('created_at', { ascending: false });

        console.log('🏘️ [MINISITE] Properties query result:', { 
          count: propertiesData?.length, 
          error: propertiesError 
        });

        if (!propertiesError && propertiesData) {
          const formattedProperties: Property[] = propertiesData.map((prop: any) => ({
            id: prop.id,
            title: prop.title || '',
            price: prop.price || 0,
            bedrooms: prop.bedrooms || 0,
            bathrooms: prop.bathrooms || 0,
            parking: prop.parking || 0,
            area_total: prop.area_total || 0,
            neighborhood: prop.neighborhood || '',
            city: prop.city || '',
            state: prop.state || '',
            description: prop.description || '',
            type: prop.type || '',
            purpose: prop.purpose || '',
            street: prop.street,
            number: prop.number,
            zipcode: prop.zipcode,
            latitude: prop.latitude,
            longitude: prop.longitude,
            created_at: prop.created_at,
            photos: prop.imovel_images
              ?.sort((a: any, b: any) => {
                if (a.is_cover) return -1;
                if (b.is_cover) return 1;
                return (a.position || 0) - (b.position || 0);
              })
              .map((img: any) => img.url) || []
          }));

          console.log('✅ [MINISITE] Formatted properties:', formattedProperties.length);
          setProperties(formattedProperties);
        } else {
          console.log('⚠️ [MINISITE] No properties found or error');
          setProperties([]);
        }
      }
    } catch (error) {
      console.error('❌ [MINISITE] Error fetching minisite:', error);
      setMinisiteNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchMinisiteData();
  }, [fetchMinisiteData]);

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !searchTerm || 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    const matchesPurpose = purposeFilter === 'all' || property.purpose === purposeFilter;
    const matchesMinPrice = !minPrice || property.price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || property.price <= parseFloat(maxPrice);
    const matchesBedrooms = bedroomsFilter === 'all' || property.bedrooms >= parseInt(bedroomsFilter);

    return matchesSearch && matchesType && matchesPurpose && matchesMinPrice && matchesMaxPrice && matchesBedrooms;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          message: contactForm.message || 'Contato via minisite',
          broker_id: config?.broker_id
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Sua mensagem foi enviada. O corretor entrará em contato em breve!",
      });

      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = (message?: string) => {
    if (config?.broker_whatsapp) {
      const defaultMessage = message || `Olá ${config.broker_name}! Vi seu minisite e gostaria de conversar sobre imóveis.`;
      const encodedMessage = encodeURIComponent(defaultMessage);
      window.open(`https://wa.me/${config.broker_whatsapp.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando minisite...</p>
        </div>
      </div>
    );
  }

  if (minisiteNotFound || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Minisite não encontrado</h1>
          <p className="text-muted-foreground">O minisite que você está procurando não existe ou foi desativado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-8 md:py-12 text-center" style={{ backgroundColor: config.primary_color }}>
        <div className="container mx-auto px-4">
          {config.broker_avatar && (
            <img 
              src={config.broker_avatar} 
              alt={config.broker_name}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 border-4 border-white"
            />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-white/90 text-base md:text-lg">{config.description}</p>
          <p className="text-white/80 mt-2 text-sm md:text-base">
            {config.broker_name} {config.broker_creci && `- CRECI: ${config.broker_creci}`}
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* About Section */}
            {config.show_about && config.description && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-xl md:text-2xl font-bold mb-4">Sobre o Corretor</h2>
                  <p className="text-muted-foreground">{config.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Properties Section */}
            {config.show_properties && (
              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">Imóveis em Destaque</h2>
                
                {/* Mobile-Optimized Search and Filters */}
                <div className="mb-6 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      placeholder="Buscar imóveis..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 md:h-10 text-base"
                    />
                  </div>
                  
                  {/* Filters - Stack on mobile, grid on desktop */}
                  <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-12 md:h-10">
                        <SelectValue placeholder="Tipo de Imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                      <SelectTrigger className="h-12 md:h-10">
                        <SelectValue placeholder="Finalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="Preço mínimo"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-12 md:h-10 text-base"
                    />

                    <Input
                      type="number"
                      placeholder="Preço máximo"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-12 md:h-10 text-base"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
                      <SelectTrigger className="h-12 md:h-10">
                        <SelectValue placeholder="Quartos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="1">1+ quartos</SelectItem>
                        <SelectItem value="2">2+ quartos</SelectItem>
                        <SelectItem value="3">3+ quartos</SelectItem>
                        <SelectItem value="4">4+ quartos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Properties Grid */}
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum imóvel disponível no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredProperties.map((property) => (
                      <AnimatedCard key={property.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          {/* Property Image - Mobile optimized aspect ratio */}
                          <div className="relative aspect-[4/3] sm:h-48 overflow-hidden">
                            {property.photos && property.photos.length > 0 ? (
                              <img
                                src={property.photos[0]}
                                alt={property.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            <Badge className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm">
                              {property.purpose === 'venda' ? 'Venda' : 'Aluguel'}
                            </Badge>
                          </div>

                          {/* Property Details */}
                          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                            <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{property.title}</h3>
                            
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                              <span className="line-clamp-1">
                                {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              {property.bedrooms > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{property.bedrooms}</span>
                                </div>
                              )}
                              {property.bathrooms > 0 && (
                                <div className="flex items-center gap-1">
                                  <Bath className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{property.bathrooms}</span>
                                </div>
                              )}
                              {property.area_total > 0 && (
                                <div className="flex items-center gap-1">
                                  <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{property.area_total}m²</span>
                                </div>
                              )}
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-shrink">
                                <p className="text-xs text-muted-foreground">Valor</p>
                                <p className="text-lg sm:text-xl font-bold text-primary truncate">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                    maximumFractionDigits: 0
                                  }).format(property.price)}
                                </p>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-shrink-0 h-9 sm:h-10 touch-target"
                                onClick={() => openWhatsApp(`Olá! Gostaria de mais informações sobre o imóvel: ${property.title}`)}
                              >
                                <MessageCircle className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Contato</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </AnimatedCard>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Custom Message */}
            {config.custom_message && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <p className="text-center text-base md:text-lg italic">{config.custom_message}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            {config.show_contact && (
              <Card>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <h3 className="text-lg font-bold mb-4">Contato</h3>
                  {config.broker_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{config.broker_phone}</span>
                    </div>
                  )}
                  {config.broker_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm break-all">{config.broker_email}</span>
                    </div>
                  )}
                  {config.broker_whatsapp && (
                    <Button 
                      onClick={() => openWhatsApp()}
                      className="w-full bg-green-600 hover:bg-green-700 h-12 touch-target"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Form */}
            {config.show_contact && (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-lg font-bold mb-4">Envie sua Mensagem</h3>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm">Nome *</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="h-12 md:h-10 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="h-12 md:h-10 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm">Telefone *</Label>
                      <Input
                        id="phone"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        className="h-12 md:h-10 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-sm">Mensagem</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                        className="text-base"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 touch-target">
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Minisite criado com ConectaIOS - Tecnologia Imobiliária</p>
        </div>
      </footer>
    </div>
  );
}
