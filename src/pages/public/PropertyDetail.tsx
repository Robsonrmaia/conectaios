import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Share2, 
  MessageSquare, 
  User, 
  ArrowLeft,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ShareButton } from '@/components/ShareButton';
import { FavoritesManager } from '@/components/FavoritesManager';

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
  reference_code: string;
  created_at: string;
  user_id: string;
}

interface BrokerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
  creci: string;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [broker, setBroker] = useState<BrokerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [contactForm, setContactForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    mensagem: ''
  });

  useEffect(() => {
    if (id) {
      fetchPropertyAndBroker();
    }
  }, [id]);

  const fetchPropertyAndBroker = async () => {
    try {
      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from('conectaios_properties')
        .select('*')
        .eq('id', id)
        .eq('visibility', 'public_site')
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Fetch broker info
      const { data: brokerData, error: brokerError } = await supabase
        .from('conectaios_brokers')
        .select('*')
        .eq('user_id', propertyData.user_id)
        .eq('status', 'active')
        .single();

      if (brokerError) throw brokerError;
      setBroker(brokerData);

    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Erro",
        description: "Imóvel não encontrado ou não disponível",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          interesse: contactForm.mensagem || `Interesse no imóvel: ${property?.titulo}`,
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
    if (!broker?.phone) return;
    const phone = broker.phone.replace(/\D/g, '');
    const message = `Olá ${broker.name}! Vi o imóvel "${property?.titulo}" (${property?.reference_code}) e tenho interesse. Você pode me ajudar?`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openPhotoGallery = (initialIndex: number = 0) => {
    setGalleryInitialIndex(initialIndex);
    setGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!property || !broker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Imóvel não encontrado</h1>
          <p className="text-muted-foreground mb-8">
            O imóvel que você está procurando não existe ou não está disponível.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const photos = property.fotos || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted relative rounded-t-lg overflow-hidden">
                  {photos.length > 0 ? (
                    <img
                      src={photos[0]}
                      alt={property.titulo}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => openPhotoGallery(0)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {photos.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded">
                      +{photos.length - 1} fotos
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/90 text-primary-foreground">
                      {property.listing_type === 'venda' ? 'Venda' : 'Locação'}
                    </Badge>
                  </div>

                  <div className="absolute top-4 right-4 flex gap-2">
                    <ShareButton 
                      propertyId={property.id}
                      propertyTitle={property.titulo}
                      ownerUserId={broker.user_id}
                    />
                    <FavoritesManager propertyId={property.id} />
                  </div>
                </div>

                {/* Thumbnail strip */}
                {photos.length > 1 && (
                  <div className="p-4">
                    <div className="flex gap-2 overflow-x-auto">
                      {photos.slice(0, 5).map((photo, index) => (
                        <button
                          key={index}
                          className="flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 hover:border-primary transition-colors"
                          onClick={() => openPhotoGallery(index)}
                        >
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {photos.length > 5 && (
                        <button
                          className="flex-shrink-0 w-20 h-16 rounded bg-muted border-2 hover:border-primary transition-colors flex items-center justify-center text-xs text-muted-foreground"
                          onClick={() => openPhotoGallery(5)}
                        >
                          +{photos.length - 5}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{property.titulo}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <MapPin className="h-4 w-4" />
                      {property.address && `${property.address}, `}
                      {property.neighborhood}, {property.city}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {property.reference_code}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-3xl font-bold text-primary">
                  R$ {property.valor.toLocaleString('pt-BR')}
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{property.area}</p>
                    <p className="text-sm text-muted-foreground">m²</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Bed className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{property.quartos}</p>
                    <p className="text-sm text-muted-foreground">Quartos</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Bath className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{property.bathrooms}</p>
                    <p className="text-sm text-muted-foreground">Banheiros</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Car className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold">{property.parking_spots}</p>
                    <p className="text-sm text-muted-foreground">Vagas</p>
                  </div>
                </div>

                {property.descricao && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {property.descricao}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Broker Card */}
            <Card>
              <CardHeader>
                <CardTitle>Corretor Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full overflow-hidden">
                    {broker.avatar_url ? (
                      <img
                        src={broker.avatar_url}
                        alt={broker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{broker.name}</h3>
                    {broker.creci && (
                      <p className="text-sm text-muted-foreground">CRECI: {broker.creci}</p>
                    )}
                  </div>
                </div>

                {broker.bio && (
                  <p className="text-sm text-muted-foreground">{broker.bio}</p>
                )}

                <div className="space-y-2">
                  {broker.phone && (
                    <Button 
                      className="w-full" 
                      onClick={openWhatsApp}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" strokeWidth={2} fill="none" />
                      WhatsApp
                    </Button>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Entrar em contato</DialogTitle>
                        <DialogDescription>
                          Envie uma mensagem sobre este imóvel
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="nome">Nome completo</Label>
                          <Input
                            id="nome"
                            value={contactForm.nome}
                            onChange={(e) => setContactForm({...contactForm, nome: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            value={contactForm.telefone}
                            onChange={(e) => setContactForm({...contactForm, telefone: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
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
                            placeholder={`Tenho interesse no imóvel "${property.titulo}"`}
                            value={contactForm.mensagem}
                            onChange={(e) => setContactForm({...contactForm, mensagem: e.target.value})}
                            rows={4}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Enviar Mensagem
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="capitalize">{property.property_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Finalidade:</span>
                  <span className="capitalize">{property.listing_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-mono">{property.reference_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publicado:</span>
                  <span>{new Date(property.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <PhotoGallery
        photos={photos}
        initialIndex={galleryInitialIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}