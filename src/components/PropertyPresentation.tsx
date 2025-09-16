import { MapPin, Calendar, Share2, Phone, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

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
  descricao?: string;
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
}

interface PropertyPresentationProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyPresentation({ property, isOpen, onClose }: PropertyPresentationProps) {
  if (!isOpen) return null;

  const handleScheduleVisit = () => {
    const message = `Olá! Gostaria de agendar uma visita ao imóvel "${property.titulo}" - ${formatCurrency(property.valor)}`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.titulo,
        text: property.descricao,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleCall = () => {
    window.open('tel:+5511999999999', '_self');
  };

  const handleEmail = () => {
    const subject = `Interesse no imóvel: ${property.titulo}`;
    const body = `Olá! Tenho interesse no imóvel "${property.titulo}" no valor de ${formatCurrency(property.valor)}. Gostaria de mais informações.`;
    window.open(`mailto:contato@imobiliarialuxo.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen">
        {/* Header com botão fechar */}
        <div className="absolute top-4 right-4 z-10">
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white/90 hover:bg-white">
            ✕ Fechar
          </Button>
        </div>

        {/* Hero Section */}
        <div 
          className="relative h-screen flex items-center justify-center bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${property.fotos[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80'})`
          }}
        >
          <div className="text-center text-white max-w-4xl px-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              {property.titulo}
            </h1>
            <p className="text-2xl md:text-3xl text-blue-300 mb-8">
              {property.neighborhood || 'Localização Premium'}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={handleScheduleVisit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Agendar Visita
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleShare}
                className="bg-green-600 hover:bg-green-700 text-white border-green-600 px-8 py-4 text-lg"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          
          {/* Sobre o Imóvel */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Sobre o Imóvel</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="text-lg leading-relaxed">
                {property.descricao || 
                `Esta magnífica residência combina elegância contemporânea com funcionalidade excepcional. 
                Localizada em uma das áreas mais valorizadas da cidade, oferece privacidade e sofisticação 
                em cada detalhe. Os ambientes amplos e bem iluminados proporcionam uma experiência única de moradia.`}
              </p>
            </div>
          </section>

          {/* Especificações */}
          <section className="mb-16">
            <h3 className="text-2xl font-bold mb-8">Especificações</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-card p-6 rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary mb-2">{formatCurrency(property.valor)}</div>
                <div className="text-sm text-muted-foreground">Valor</div>
              </div>
              <div className="bg-card p-6 rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary mb-2">{property.area}m²</div>
                <div className="text-sm text-muted-foreground">Área</div>
              </div>
              <div className="bg-card p-6 rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary mb-2">{property.quartos}</div>
                <div className="text-sm text-muted-foreground">Quartos</div>
              </div>
              <div className="bg-card p-6 rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary mb-2">{property.bathrooms || '-'}</div>
                <div className="text-sm text-muted-foreground">Banheiros</div>
              </div>
            </div>
            
            {/* Características adicionais */}
            <div className="mt-8 flex flex-wrap gap-2">
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
          </section>

          {/* Informações */}
          <section className="mb-16">
            <h3 className="text-2xl font-bold mb-8">Informações</h3>
            <div className="bg-card p-8 rounded-lg border">
              <div className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80" 
                  alt="Planta do Imóvel" 
                  className="w-full max-w-md mx-auto rounded-lg mb-4"
                />
                <h4 className="text-lg font-semibold mb-2">Planta Baixa</h4>
                <p className="text-sm text-muted-foreground">Clique para ampliar</p>
              </div>
            </div>
          </section>

          {/* Localização */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Localização Privilegiada</h2>
            <p className="text-lg text-muted-foreground mb-8">
              No coração do {property.neighborhood || 'bairro'}, próximo a tudo que você precisa
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
                <div className="text-center">
                  <img 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" 
                    alt="Corretor" 
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-bold mb-2">Ricardo Silva</h3>
                  <p className="text-sm text-muted-foreground mb-1">CRECI 123.456-F</p>
                  <p className="text-sm text-muted-foreground mb-4">15 anos de experiência</p>
                  
                  <div className="space-y-2 text-sm mb-6">
                    <p>(11) 9 9999-9999</p>
                    <p>contato@imobiliarialuxo.com.br</p>
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