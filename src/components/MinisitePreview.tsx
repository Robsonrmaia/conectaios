import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, Bed, Bath, Square, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { PropertyIcons } from "./PropertyIcons";

interface MinisitePreviewProps {
  config: any;
  broker: any;
  properties?: any[];
  preview?: 'mobile' | 'tablet' | 'desktop';
}

export default function MinisitePreview({ config, broker, properties = [], preview = 'desktop' }: MinisitePreviewProps) {
  const primaryColor = config?.primary_color || '#1CA9C9';
  const secondaryColor = config?.secondary_color || '#64748B';
  const templateId = config?.template_id || 'modern';

  const getTemplateStyles = () => {
    switch (templateId) {
      case 'classic':
        return {
          headerBg: 'bg-gradient-to-r from-gray-800 to-gray-900',
          heroBg: 'bg-gradient-to-b from-gray-50 to-white',
          cardStyle: 'shadow-md hover:shadow-lg transition-shadow',
          fontFamily: 'serif'
        };
      case 'minimal':
        return {
          headerBg: 'bg-white border-b-2',
          heroBg: 'bg-white',
          cardStyle: 'border border-gray-200 hover:border-gray-300 transition-colors',
          fontFamily: 'sans-serif'
        };
      case 'luxury':
        return {
          headerBg: 'bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200',
          heroBg: 'bg-gradient-to-b from-amber-50 via-orange-50 to-white',
          cardStyle: 'shadow-xl border border-amber-100 hover:shadow-2xl transition-all',
          fontFamily: 'serif'
        };
      case 'modern':
      default:
        return {
          headerBg: 'bg-white/90 backdrop-blur border-b',
          heroBg: 'bg-gradient-to-b from-blue-50 to-white',
          cardStyle: 'shadow-sm hover:shadow-md transition-shadow',
          fontFamily: 'sans-serif'
        };
    }
  };

  const templateStyles = getTemplateStyles();

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

  // Use real properties from user's property list or fetch them
  const [realProperties, setRealProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!broker?.user_id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('conectaios_properties')
          .select('id, titulo, valor, quartos, bathrooms, area, fotos, neighborhood, property_type, listing_type, furnishing_type, sea_distance, has_sea_view, parking_spots')
          .eq('user_id', broker.user_id)
          .eq('broker_minisite_enabled', true)
          .in('visibility', ['public_site', 'both'])
          .order('updated_at', { ascending: false })
          .limit(6);

        console.log('Minisite properties query result:', data, 'User ID:', broker.user_id);

        if (error) throw error;
        setRealProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [broker?.user_id]);

  // Use real properties or fallback to provided properties or mock
  const displayProperties = realProperties.length > 0 
    ? realProperties.slice(0, 3) 
    : properties.length > 0 
    ? properties.slice(0, 3) 
    : [{
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
      }];

  return (
    <div className={`${getPreviewClasses()} overflow-auto border rounded-lg bg-white shadow-xl`}>
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <header className={`sticky top-0 z-50 ${templateStyles.headerBg}`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
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
              <span className={`font-semibold text-lg ${templateId === 'classic' || templateId === 'luxury' ? 'font-serif' : ''}`}>
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
        <section className="relative">
          {/* Cover Image */}
          {broker?.cover_url && (
            <div 
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${broker.cover_url})` }}
            >
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
          )}
          
          <div className={`p-6 ${broker?.cover_url ? 'bg-white -mt-6 mx-4 rounded-t-xl relative z-10 shadow-lg' : templateStyles.heroBg}`}>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                <Building2 className="h-4 w-4" />
                Atendimento especializado
              </div>
              <h1 className={`text-2xl md:text-3xl font-bold text-gray-900 ${templateId === 'classic' || templateId === 'luxury' ? 'font-serif' : ''}`}>
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
          </div>
        </section>

        {/* Properties Section */}
        {config?.show_properties !== false && (
          <section className="p-6">
            <h2 className="text-xl font-bold mb-4">Imóveis em Destaque</h2>
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Carregando imóveis...</p>
                </div>
              ) : displayProperties.map((property) => (
                <Card key={property.id} className={`overflow-hidden ${templateStyles.cardStyle}`}>
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
                      <h3 className={`font-medium text-sm mb-1 ${templateId === 'classic' || templateId === 'luxury' ? 'font-serif' : ''}`}>
                        {property.titulo}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {property.quartos && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {property.quartos}
                          </span>
                        )}
                        {property.area && (
                          <span className="flex items-center gap-1">
                            <Square className="h-3 w-3" />
                            {property.area}m²
                          </span>
                        )}
                      </div>
                      <PropertyIcons
                        bathrooms={property.bathrooms}
                        parking_spots={property.parking_spots}
                        furnishing_type={property.furnishing_type}
                        sea_distance={property.sea_distance}
                        className="mb-2"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold" style={{ color: primaryColor }}>
                            {property.valor ? 
                              property.valor.toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }) : 'Consulte'
                            }
                          </p>
                          {property.neighborhood && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.neighborhood}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Ver Detalhes
                        </Button>
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
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                {broker?.avatar_url ? (
                  <img 
                    src={broker.avatar_url} 
                    alt={broker.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-lg mb-1 ${templateId === 'classic' || templateId === 'luxury' ? 'font-serif' : ''}`}>
                  {broker?.name || 'Corretor Especialista'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {broker?.bio || config?.description || 'Profissional especializado em imóveis com anos de experiência no mercado.'}
                </p>
                <div className="flex gap-2">
                  {config?.phone && (
                    <Button size="sm" style={{ backgroundColor: primaryColor }} className="text-white">
                      <Phone className="h-3 w-3 mr-1" />
                      Ligar
                    </Button>
                  )}
                  {config?.email && (
                    <Button size="sm" variant="outline">
                      <Mail className="h-3 w-3 mr-1" />
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
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Nome</Label>
                  <input 
                    id="name"
                    type="text" 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Seu nome"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <input 
                    id="email"
                    type="email" 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="seu@email.com"
                    disabled
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm">Telefone</Label>
                <input 
                  id="phone"
                  type="tel" 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="(11) 99999-9999"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-sm">Mensagem</Label>
                <textarea 
                  id="message"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Como posso ajudá-lo?"
                  disabled
                />
              </div>
              <Button 
                type="button" 
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
                disabled
              >
                Enviar Mensagem (Preview)
              </Button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}