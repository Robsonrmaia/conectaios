import { Building2, Phone, Mail, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MinisitePreviewProps {
  config: any;
  broker: any;
  properties?: any[];
  preview: string;
}

export function MinisitePreview({ config, broker, properties = [], preview }: MinisitePreviewProps) {
  const primaryColor = config?.primary_color || '#1CA9C9';
  const secondaryColor = config?.secondary_color || '#64748B';

  const getPreviewClasses = () => {
    switch (preview) {
      case 'mobile':
        return 'w-80 h-[600px]';
      case 'tablet':
        return 'w-96 h-[700px]';
      case 'desktop':
      default:
        return 'w-full h-[800px]';
    }
  };

  // Mock properties if none provided
  const displayProperties = properties.length > 0 ? properties.slice(0, 3) : [
    {
      id: '1',
      titulo: 'Apartamento Moderno no Centro',
      valor: 450000,
      quartos: 2,
      bathrooms: 2,
      area: 75,
      fotos: [],
      neighborhood: 'Centro'
    },
    {
      id: '2', 
      titulo: 'Casa com Quintal',
      valor: 320000,
      quartos: 3,
      bathrooms: 2,
      area: 120,
      fotos: [],
      neighborhood: 'Jardim Europa'
    }
  ];

  return (
    <div className={`${getPreviewClasses()} border rounded-lg bg-white overflow-hidden shadow-lg`}>
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                {broker?.avatar_url ? (
                  <img 
                    src={broker.avatar_url} 
                    alt="Logo" 
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </div>
              <span className="font-semibold text-lg">
                {broker?.name || config?.title || 'Corretor'}
              </span>
            </div>
            {preview === 'desktop' && (
              <div className="flex items-center gap-4 text-sm">
                <a href="#inicio" className="hover:opacity-70">Início</a>
                <a href="#imoveis" className="hover:opacity-70">Imóveis</a>
                <a href="#sobre" className="hover:opacity-70">Sobre</a>
                <a href="#contato" className="hover:opacity-70">Contato</a>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="p-6 bg-gradient-to-b from-blue-50 to-white">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
              <Building2 className="h-4 w-4" />
              Atendimento especializado
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {config?.title || 'Encontre seu imóvel ideal'}
            </h1>
            <p className="text-gray-600 max-w-md mx-auto text-sm">
              {config?.description || broker?.bio || 'Especialista em imóveis com atendimento personalizado e transparente.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                size="sm" 
                className="text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Ver Imóveis
              </Button>
              <Button variant="outline" size="sm">
                Fale Conosco
              </Button>
            </div>
          </div>
        </section>

        {/* Properties Section */}
        {config?.show_properties !== false && (
          <section className="p-6">
            <h2 className="text-xl font-bold mb-4">Imóveis em Destaque</h2>
            <div className="grid gap-4">
              {displayProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="flex">
                    {property.fotos && property.fotos.length > 0 ? (
                      <img
                        src={property.fotos[0]}
                        alt={property.titulo}
                        className="w-24 h-20 object-cover"
                      />
                    ) : (
                      <div className="w-24 h-20 bg-muted flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="flex-1 p-3">
                      <h3 className="font-medium text-sm mb-1">{property.titulo}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {property.quartos && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {property.quartos}
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            {property.bathrooms}
                          </span>
                        )}
                        {property.area && (
                          <span className="flex items-center gap-1">
                            <Square className="h-3 w-3" />
                            {property.area}m²
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm" style={{ color: primaryColor }}>
                          {property.valor ? 
                            property.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
                            'Consulte'
                          }
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {property.neighborhood || 'Centro'}
                        </Badge>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* About Section */}
        {config?.show_about !== false && (
          <section className="p-6 bg-gray-50">
            <h2 className="text-xl font-bold mb-4">Sobre o Corretor</h2>
            <div className="flex items-start gap-4">
              {broker?.avatar_url ? (
                <img 
                  src={broker.avatar_url} 
                  alt="Corretor" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{broker?.name || 'Corretor Especialista'}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {broker?.bio || config?.custom_message || 'Profissional experiente no mercado imobiliário, pronto para ajudar você a encontrar o imóvel ideal.'}
                </p>
                <div className="flex gap-2 mt-3">
                  {(config?.phone || broker?.phone) && (
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Ligar
                    </Button>
                  )}
                  {(config?.email || broker?.email) && (
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contact Form Section */}
        {config?.show_contact_form !== false && (
          <section className="p-6">
            <h2 className="text-xl font-bold mb-4">Entre em Contato</h2>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Seu nome" 
                className="w-full p-2 border rounded text-sm"
                disabled
              />
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="w-full p-2 border rounded text-sm"
                disabled
              />
              <input 
                type="tel" 
                placeholder="Seu telefone" 
                className="w-full p-2 border rounded text-sm"
                disabled
              />
              <textarea 
                placeholder="Sua mensagem" 
                rows={3}
                className="w-full p-2 border rounded text-sm resize-none"
                disabled
              />
              <Button 
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
                disabled
              >
                Enviar Mensagem
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}