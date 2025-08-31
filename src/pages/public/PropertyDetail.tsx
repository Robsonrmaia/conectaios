import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Building2, MapPin, Bed, Bath, Car, Calendar, Share2, Phone, Mail, User, Heart, ArrowLeft, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoritesManager } from '@/components/FavoritesManager';
import { ShareButton } from '@/components/ShareButton';

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
  condominium_fee?: number;
  iptu?: number;
  created_at: string;
  brokers: {
    name: string;
    phone?: string;
    email: string;
    avatar_url?: string;
    creci?: string;
    user_id?: string;
  };
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    mensagem: 'Tenho interesse no imóvel. Gostaria de mais informações.'
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      // First get the property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('visibility', 'public_site')
        .single();

      if (propertyError) throw propertyError;

      // Then get the broker info
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('name, phone, email, avatar_url, creci, user_id')
        .eq('user_id', propertyData.user_id)
        .single();

      if (brokerError) {
        console.error('Error fetching broker:', brokerError);
        // Set default broker data if not found
        setProperty({
          ...propertyData,
          brokers: {
            name: 'Corretor',
            email: 'contato@exemplo.com'
          }
        });
      } else {
        setProperty({
          ...propertyData,
          brokers: brokerData
        });
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Erro",
        description: "Imóvel não encontrado ou não está disponível",
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
          interesse: `Interesse no imóvel: ${property?.titulo}`,
          ip_address: '0.0.0.0', // Mock IP
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      toast({
        title: "Mensagem Enviada!",
        description: "O corretor entrará em contato em breve.",
      });

      setContactForm({
        nome: '',
        telefone: '',
        email: '',
        mensagem: 'Tenho interesse no imóvel. Gostaria de mais informações.'
      });
    } catch (error) {
      console.error('Error sending contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const shareProperty = () => {
    const url = window.location.href;
    const text = `Confira este imóvel: ${property?.titulo}`;
    
    if (navigator.share) {
      navigator.share({
        title: property?.titulo,
        text,
        url
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${text} - ${url}`);
      toast({
        title: "Link Copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  const openWhatsApp = () => {
    const phone = property?.brokers?.phone?.replace(/\D/g, '');
    const message = `Olá! Tenho interesse no imóvel "${property?.titulo}" que vi no site. Você pode me dar mais informações?`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Imóvel não encontrado</h1>
            <p className="text-muted-foreground mb-8">
              O imóvel que você está procurando não existe ou não está mais disponível.
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="flex gap-2">
              <ShareButton 
                propertyId={property.id}
                propertyTitle={property.titulo}
                ownerUserId={property.brokers?.user_id}
              />
              <FavoritesManager propertyId={property.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Title and Price */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {property.listing_type === 'venda' ? 'Venda' : 'Locação'}
              </Badge>
              <Badge variant="outline">{property.property_type}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{property.titulo}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="h-4 w-4" />
              <span>{property.address}, {property.neighborhood}, {property.city}</span>
            </div>
            <div className="text-4xl font-bold text-primary">
              R$ {property.valor.toLocaleString('pt-BR')}
            </div>
            {property.condominium_fee && (
              <p className="text-muted-foreground">
                + Condomínio: R$ {property.condominium_fee.toLocaleString('pt-BR')}
              </p>
            )}
            {property.iptu && (
              <p className="text-muted-foreground">
                IPTU: R$ {property.iptu.toLocaleString('pt-BR')}/ano
              </p>
            )}
          </div>

          {/* Image Gallery */}
          {property.fotos && property.fotos.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={property.fotos[currentImageIndex]}
                    alt={`${property.titulo} - Foto ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {property.fotos.length > 1 && (
                  <div className="p-4">
                    <div className="flex gap-2 overflow-x-auto">
                      {property.fotos.map((foto, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                            currentImageIndex === index 
                              ? 'border-primary' 
                              : 'border-transparent'
                          }`}
                        >
                          <img
                            src={foto}
                            alt={`Miniatura ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Property Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.area}</div>
                      <div className="text-sm text-muted-foreground">m²</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Bed className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.quartos}</div>
                      <div className="text-sm text-muted-foreground">quartos</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Bath className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">banheiros</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-2xl font-bold">{property.parking_spots}</div>
                      <div className="text-sm text-muted-foreground">vagas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {property.descricao || 'Descrição não disponível.'}
                  </p>
                </CardContent>
              </Card>

              {/* Videos */}
              {property.videos && property.videos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vídeos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {property.videos.map((video, index) => (
                        <div key={index} className="aspect-video">
                          <iframe
                            src={video}
                            title={`Vídeo ${index + 1}`}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Contact Form */}
            <div className="space-y-6">
              {/* Broker Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Corretor Responsável</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      {property.brokers.avatar_url ? (
                        <img
                          src={property.brokers.avatar_url}
                          alt={property.brokers.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{property.brokers.name}</p>
                      {property.brokers.creci && (
                        <p className="text-sm text-muted-foreground">
                          CRECI: {property.brokers.creci}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {property.brokers.phone && (
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
                      {property.brokers.email}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Interessado? Entre em contato</CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo que o corretor entrará em contato
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
                        rows={4}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
                    >
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Property Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Imóvel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Código:</span>
                    <span className="font-mono">{property.id.slice(0, 8)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Publicado em:</span>
                    <span>{new Date(property.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Tipo:</span>
                    <span className="capitalize">{property.property_type}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Finalidade:</span>
                    <span className="capitalize">{property.listing_type}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}