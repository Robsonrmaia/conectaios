import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Building2, Phone, Mail, MapPin, Bed, Bath, Car, Share2, MessageSquare, User, Star, Send, Search, Filter, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { FavoritesManager } from '@/components/FavoritesManager';
import { ShareButton } from '@/components/ShareButton';

interface BrokerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  username: string;
  creci: string;
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms: number;
  parking_spots: number;
  listing_type: string;
  property_type: string;
  descricao: string;
  fotos: string[];
  videos: string[];
  address: string;
  neighborhood: string;
  city: string;
  created_at: string;
}

interface ContactForm {
  nome: string;
  telefone: string;
  email: string;
  interesse: string;
  mensagem: string;
}

export default function BrokerMinisite() {
  const { username } = useParams<{ username: string }>();
  const [broker, setBroker] = useState<BrokerProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('');
  const [contactForm, setContactForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    mensagem: ''
  });

  useEffect(() => {
    if (username) {
      fetchBrokerAndProperties();
    }
  }, [username]);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, priceRange, propertyType, listingType]);

  const fetchBrokerAndProperties = async () => {
    try {
      // Fetch broker by username
      const { data: brokerData, error: brokerError } = await supabase
        .from('conectaios_brokers')
        .select('*')
        .eq('username', username)
        .eq('status', 'active')
        .single();

      if (brokerError) throw brokerError;
      setBroker(brokerData);

      // Fetch properties for this broker
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('conectaios_properties')
        .select('*')
        .eq('user_id', brokerData.user_id)
        .eq('visibility', 'public_site')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
    } catch (error) {
      console.error('Error fetching broker data:', error);
      toast({
        title: "Erro",
        description: "Corretor não encontrado ou página não disponível",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    if (searchTerm) {
      filtered = filtered.filter(prop =>
        prop.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priceRange.min) {
      filtered = filtered.filter(prop => prop.valor >= parseFloat(priceRange.min));
    }

    if (priceRange.max) {
      filtered = filtered.filter(prop => prop.valor <= parseFloat(priceRange.max));
    }

    if (propertyType && propertyType !== 'all') {
      filtered = filtered.filter(prop => prop.property_type === propertyType);
    }

    if (listingType && listingType !== 'all') {
      filtered = filtered.filter(prop => prop.listing_type === listingType);
    }

    setFilteredProperties(filtered);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          nome: contactForm.nome,
          telefone: contactForm.telefone,
          email: contactForm.email,
          interesse: contactForm.mensagem || `Interesse em imóveis do corretor ${broker?.name}`,
          ip_address: '0.0.0.0',
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      toast({
        title: "Mensagem Enviada!",
        description: "O corretor entrará em contato em breve.",
      });

      setContactForm({ nome: '', telefone: '', email: '', mensagem: '' });
    } catch (error) {
      console.error('Error sending contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = () => {
    const phone = broker?.phone?.replace(/\D/g, '');
    const message = `Olá ${broker?.name}! Vi seus imóveis no seu site e tenho interesse. Você pode me ajudar?`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="container mx-auto px-4">
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            O corretor que você está procurando não existe ou não está disponível.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-primary to-brand-secondary">
        {broker.cover_url && (
          <img
            src={broker.cover_url}
            alt="Capa"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-end gap-6 text-white">
            <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white">
              {broker.avatar_url ? (
                <img
                  src={broker.avatar_url}
                  alt={broker.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{broker.name}</h1>
              <p className="text-white/90">{broker.creci && `CRECI: ${broker.creci}`}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm">4.8 (24 avaliações)</span>
                </div>
                <Badge variant="secondary">
                  {properties.length} imóveis
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Properties Grid */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros de Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <div>
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Título, bairro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="listing-type">Finalidade</Label>
                    <Select value={listingType} onValueChange={setListingType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="locacao">Locação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="property-type">Tipo</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="min-price">Preço Min</Label>
                    <Input
                      id="min-price"
                      type="number"
                      placeholder="0"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-price">Preço Max</Label>
                    <Input
                      id="max-price"
                      type="number"
                      placeholder="1000000"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'Imóvel' : 'Imóveis'}
                </h2>
              </div>

              {filteredProperties.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
                    <p className="text-muted-foreground">
                      Ajuste os filtros ou entre em contato diretamente com o corretor
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-muted relative">
                        {property.fotos?.[0] ? (
                          <img
                            src={property.fotos[0]}
                            alt={property.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary/90 text-primary-foreground">
                            {property.listing_type === 'venda' ? 'Venda' : 'Locação'}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1">
                          <ShareButton 
                            propertyId={property.id}
                            propertyTitle={property.titulo}
                            ownerUserId={broker?.user_id}
                            isOwner={true}
                          />
                          <FavoritesManager propertyId={property.id} />
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                          {property.titulo}
                        </h3>
                        
                        <div className="text-2xl font-bold text-primary mb-3">
                          R$ {property.valor.toLocaleString('pt-BR')}
                        </div>
                        
                        <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {property.area}m²
                          </span>
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {property.quartos}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            {property.bathrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {property.parking_spots}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {property.neighborhood}, {property.city}
                        </p>

                        <Button asChild className="w-full">
                          <Link to={`/imovel/${property.id}`}>
                            Ver Detalhes
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Broker Info */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Corretor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {broker.bio && (
                  <p className="text-sm text-muted-foreground">{broker.bio}</p>
                )}
                
                <div className="space-y-2">
                  {broker.phone && (
                    <Button
                      onClick={openWhatsApp}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Conversar Online
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    E-mail
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Entre em Contato</CardTitle>
                <CardDescription>
                  Envie uma mensagem diretamente para {broker.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={contactForm.nome}
                      onChange={(e) => setContactForm({...contactForm, nome: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={contactForm.telefone}
                      onChange={(e) => setContactForm({...contactForm, telefone: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea
                      id="mensagem"
                      value={contactForm.mensagem}
                      onChange={(e) => setContactForm({...contactForm, mensagem: e.target.value})}
                      placeholder="Descreva seu interesse..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="flex-1">
                        Fechar
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
                    >
                      Enviar Mensagem
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Imóveis ativos:</span>
                  <span className="font-semibold">{properties.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vendidos este mês:</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avaliação média:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span className="font-semibold">4.8</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Anos de experiência:</span>
                  <span className="font-semibold">5+</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}