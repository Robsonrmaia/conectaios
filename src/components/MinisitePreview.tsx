import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCard } from "@/components/AnimatedCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Building2, Bed, Bath, Square, Phone, Mail, MapPin, Car } from "lucide-react";
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
      case 'hero-visual':
        return {
          headerBg: 'bg-black/80 backdrop-blur border-b border-white/10',
          heroBg: 'bg-gradient-to-b from-black/60 via-black/40 to-transparent',
          cardStyle: 'shadow-2xl border-0 overflow-hidden hover:scale-105 transition-transform',
          fontFamily: 'sans-serif',
          heroHeight: 'min-h-[80vh]',
          propertyLayout: 'grid'
        };
      case 'modern':
      default:
        return {
          headerBg: 'bg-white/90 backdrop-blur border-b',
          heroBg: 'bg-gradient-to-b from-blue-50 to-white',
          cardStyle: 'shadow-sm hover:shadow-md transition-shadow',
          fontFamily: 'sans-serif',
          heroHeight: 'h-64',
          propertyLayout: 'grid'
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
        console.log('🏠 Fetching minisite properties for broker:', broker.user_id);
        console.log('🏠 Broker object:', broker);
        
        // ⚠️ ATENÇÃO: Esta query usa 'imoveis' (NÃO 'properties')
        // First, check all properties for this user to debug
        const { data: allUserProperties, error: allError } = await supabase
          .from('imoveis')
          .select('id, title, is_public, visibility, owner_id')
          .eq('owner_id', broker.user_id);
          
        console.log('🏠 All user properties debug:', { 
          data: allUserProperties, 
          error: allError, 
          count: allUserProperties?.length || 0 
        });
        
        // ⚠️ ATENÇÃO: Esta query usa 'imoveis' (NÃO 'properties')
        // Now fetch filtered properties for minisite
        const { data, error } = await supabase
          .from('imoveis')
          .select(`
            id,
            title,
            price,
            area_total,
            bedrooms,
            bathrooms,
            parking,
            is_furnished,
            distancia_mar,
            vista_mar,
            purpose,
            property_type,
            neighborhood,
            zipcode,
            condo_fee,
            iptu,
            description,
            reference_code,
            created_at
          `)
          .eq('owner_id', broker.user_id)
          .eq('is_public', true)
          .in('visibility', ['public_site', 'both'])
          .order('updated_at', { ascending: false })
          .limit(6);

        console.log('🏠 Minisite filtered properties result:', { 
          data: data, 
          error: error, 
          count: data?.length || 0,
          broker_user_id: broker.user_id,
          query_filters: {
            user_id: broker.user_id,
            is_public: true,
            visibility: ['public_site', 'marketplace']
          }
        });

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

  // Use real properties or provided properties, no fallback to mock data
  const displayProperties = realProperties.length > 0 
    ? realProperties.slice(0, 3) 
    : properties.length > 0 
    ? properties.slice(0, 3) 
    : [];

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
              <span className={`font-semibold text-lg`}>
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
          {templateId === 'hero-visual' ? (
            /* ========== HERO VISUAL: Hero gigante com imagem full ========== */
            <div 
              className={`${templateStyles.heroHeight} bg-cover bg-center relative flex items-center justify-center`}
              style={{ 
                backgroundImage: broker?.cover_url 
                  ? `url(${broker.cover_url})` 
                  : `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop')`
              }}
            >
              {/* Overlay escuro */}
              <div className="absolute inset-0 bg-black/50"></div>
              
              {/* Conteúdo centralizado */}
              <div className="relative z-10 text-center text-white px-6 max-w-4xl space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur text-white text-sm font-medium">
                  <Building2 className="h-5 w-5" />
                  Atendimento especializado
                </div>
                
                {/* Título GIGANTE */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  {config?.title || 'Encontre seu imóvel dos sonhos'}
                </h1>
                
                {/* Descrição */}
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                  {config?.description || broker?.bio || 'Especialista em imóveis com atendimento personalizado e transparente.'}
                </p>
                
                {/* Contatos */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-base">
                  {broker?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      {broker.phone}
                    </div>
                  )}
                  {broker?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {broker.email}
                    </div>
                  )}
                </div>
                
                {/* CTAs grandes */}
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="text-white font-semibold px-10 py-6 text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Ver Imóveis
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-white/20 backdrop-blur border-2 border-white/30 text-white hover:bg-white/30 px-10 py-6 text-lg font-semibold"
                  >
                    Fale Conosco
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ========== MODERN: Hero simples com gradiente ========== */
            <>
              {/* Cover Image (se existir) */}
              {broker?.cover_url && (
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${broker.cover_url})` }}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              )}
              
              {/* Conteúdo do hero */}
              <div className={`p-6 ${broker?.cover_url ? 'bg-white -mt-6 mx-4 rounded-t-xl relative z-10 shadow-lg' : templateStyles.heroBg}`}>
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
              </div>
            </>
          )}
        </section>

        {/* Properties Section */}
        {config?.show_properties !== false && (
          <section className="p-6">
            <h2 className={`text-xl font-bold mb-4`}>
              Imóveis em Destaque
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Carregando imóveis...</p>
              </div>
            ) : displayProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {displayProperties.map((property) => (
                  <AnimatedCard key={property.id} className={`overflow-hidden ${templateStyles.cardStyle}`}>
                    <div className="aspect-video relative overflow-hidden">
                      {property.fotos && property.fotos.length > 0 ? (
                        <img
                          src={property.fotos[0]}
                          alt={property.titulo}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-gray-100 flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {/* Badge de tipo */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          {property.listing_type === 'venda' ? 'Venda' : property.listing_type === 'aluguel' ? 'Aluguel' : 'Venda'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg leading-tight">
                        {property.titulo}
                      </h3>
                      
                      {/* Preço destacado */}
                      <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {property.valor ? 
                          property.valor.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }) : 'Consulte'
                        }
                      </p>

                      {/* Localização */}
                      {property.neighborhood && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {property.neighborhood}
                        </p>
                      )}

                      {/* Ícones de propriedades */}
                      <PropertyIcons
                        bathrooms={property.bathrooms}
                        parking_spots={property.parking_spots}
                        furnishing_type={property.furnishing_type}
                        sea_distance={property.sea_distance}
                        has_sea_view={property.has_sea_view}
                        showBasicIcons={true}
                        className="flex-wrap"
                      />

                      {/* Descrição truncada */}
                      {property.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {property.descricao}
                        </p>
                      )}

                      {/* Código de referência */}
                      {property.reference_code && (
                        <p className="text-xs text-muted-foreground">
                          Cód: {property.reference_code}
                        </p>
                      )}

                      {/* Info do corretor */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {broker?.avatar_url ? (
                          <img 
                            src={broker.avatar_url} 
                            alt="Corretor" 
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-3 w-3" />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{broker?.name || 'Corretor'}</span>
                          {broker?.creci && <span> • CRECI {broker.creci}</span>}
                        </div>
                      </div>

                      {/* Botão de ação */}
                      <Button 
                        size="sm" 
                        className="w-full text-white font-medium"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Contatar
                      </Button>
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>
            ) : realProperties.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum imóvel encontrado</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a visibilidade dos seus imóveis para exibi-los no minisite
                </p>
              </div>
            ) : null}
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
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{broker?.name || 'Nome do Corretor'}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {broker?.creci ? `CRECI: ${broker.creci}` : 'Corretor de Imóveis'}
                </p>
                <p className="text-sm leading-relaxed mb-4">
                  {broker?.bio || config?.description || 'Corretor especializado em imóveis residenciais e comerciais, oferecendo atendimento personalizado e consultoria completa.'}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contato
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contact Form Section */}
        {config?.show_contact_form && (
          <section className="p-6 bg-white">
            <h2 className="text-xl font-bold mb-4">Entre em Contato</h2>
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <input 
                  id="name"
                  type="text" 
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100" 
                  placeholder="Seu nome" 
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <input 
                  id="email"
                  type="email" 
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100" 
                  placeholder="seu@email.com" 
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <textarea 
                  id="message"
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-gray-100 h-24" 
                  placeholder="Sua mensagem..." 
                  disabled
                />
              </div>
              <Button 
                className="w-full text-white" 
                disabled
                style={{ backgroundColor: primaryColor, opacity: 0.6 }}
              >
                Enviar Mensagem (Preview)
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}