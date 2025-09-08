import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Bed, Bath, Square, MessageCircle, Share2, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Broker = {
  id: string;
  user_id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  status?: string;
  phone?: string;
  email?: string;
  creci?: string;
};

type Property = {
  id: string;
  titulo: string;
  valor?: number;
  fotos?: string[];
  city?: string;
  neighborhood?: string;
  quartos?: number;
  bathrooms?: number;
  area?: number;
  user_id?: string;
  listing_type?: string;
  property_type?: string;
  descricao?: string;
};

type MinisiteConfig = {
  id?: string;
  primary_color?: string;
  secondary_color?: string;
  show_contact_form?: boolean;
  show_about?: boolean;
  template_id?: string;
};

export default function BrokerMinisite() {
  const { username } = useParams();
  const cleanUsername = useMemo(
    () => (username ?? "").replace(/^@+/, ""),
    [username]
  );

  const [broker, setBroker] = useState<Broker | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [minisiteConfig, setMinisiteConfig] = useState<MinisiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [errs, setErrs] = useState<string[]>([]);
  const debug =
    new URLSearchParams(globalThis.location?.search || "").get("debug") === "1" ||
    globalThis.localStorage?.getItem("minisite_debug") === "1";

  const pushErr = (label: string, e: any) => {
    const msg =
      typeof e === "string"
        ? e
        : e?.message || e?.error_description || JSON.stringify(e);
    setErrs((prev) => [...prev, `${label}: ${msg}`]);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrs([]);

      // 1) Busca corretor por username na TABELA CERTA
      const bq = await supabase
        .from("conectaios_brokers")
        .select("id, user_id, username, name, avatar_url, cover_url, bio, status, phone, email, creci")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (bq.error) pushErr("broker.query", bq.error);
      if (!mounted) return;

      if (!bq.data) {
        setBroker(null);
        setProperties([]);
        setLoading(false);
        return;
      }
      setBroker(bq.data);

      // 2) Propriedades PÚBLICAS na TABELA CERTA usando user_id
      const { data: props, error: propsErr } = await supabase
        .from("conectaios_properties")
        .select("id, titulo, valor, fotos, city, neighborhood, quartos, bathrooms, area, user_id, listing_type, property_type, descricao")
        .eq("user_id", bq.data.user_id)
        .eq("is_public", true)
        .eq("visibility", "public_site")
        .order("updated_at", { ascending: false });

      if (propsErr) pushErr("properties.query", propsErr);

      // 3) Buscar configuração do minisite
      const { data: config, error: configErr } = await supabase
        .from("minisite_configs")
        .select("id, primary_color, secondary_color, show_contact_form, show_about, template_id")
        .eq("broker_id", bq.data.id)
        .maybeSingle();

      if (configErr) pushErr("minisite_configs.query", configErr);
      
      if (!mounted) return;
      setProperties(props ?? []);
      setMinisiteConfig(config);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [cleanUsername]);

  // Funções auxiliares
  const shareOnWhatsApp = (property: Property) => {
    const message = `Olá! Vi este imóvel e gostaria de mais informações:\n\n${property.titulo}\n${property.valor ? `Valor: ${property.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}\n\nLink: ${window.location.origin}/imovel/${property.id}`;
    const phone = broker?.phone?.replace(/\D/g, '') || '';
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareProperty = async (property: Property) => {
    const url = `${window.location.origin}/imovel/${property.id}`;
    try {
      if (navigator.share && navigator.canShare?.({ title: property.titulo, url })) {
        await navigator.share({
          title: property.titulo,
          text: `Confira este imóvel: ${property.titulo}`,
          url: url,
        });
        toast({
          title: "Compartilhado!",
          description: "Imóvel compartilhado com sucesso.",
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copiado!",
          description: "O link do imóvel foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      // Fallback para clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copiado!",
          description: "O link do imóvel foi copiado para a área de transferência.",
        });
      } catch (clipboardError) {
        toast({
          title: "Erro",
          description: "Não foi possível compartilhar o imóvel.",
          variant: "destructive",
        });
      }
    }
  };

  // Cores dinâmicas baseadas na configuração
  const primaryColor = minisiteConfig?.primary_color || '#1CA9C9';
  const secondaryColor = minisiteConfig?.secondary_color || '#64748B';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Corretor não encontrado</h1>
          <p className="text-muted-foreground mb-8">
            O corretor "{cleanUsername}" não foi encontrado ou não está ativo.
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
      {/* DEBUG overlay (aparece com ?debug=1) */}
      {debug && (
        <div className="fixed bottom-4 right-4 max-w-md text-sm bg-white/95 border border-red-300 text-red-700 rounded-xl shadow-lg p-3 z-50">
          <div className="font-semibold mb-1">DEBUG minisite</div>
          <div>path: <code>{globalThis.location?.pathname}</code></div>
          <div>username: <code>{username}</code> → clean: <code>{cleanUsername}</code></div>
          <div>broker.id: <code>{broker?.id || "null"}</code></div>
          <div>broker.user_id: <code>{broker?.user_id || "null"}</code></div>
          <div>properties: <code>{properties.length}</code></div>
          {errs.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold">errors:</div>
              <ul className="list-disc pl-5">
                {errs.map((e, i) => (
                  <li key={i}><code>{e}</code></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {broker.avatar_url ? (
                <img 
                  src={broker.avatar_url} 
                  alt={broker.name || broker.username}
                  className="w-8 h-8 rounded-full object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <span className="font-semibold text-lg" style={{ color: primaryColor }}>
                {broker.name || `@${broker.username}`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#imoveis" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Imóveis
              </a>
              <a href="#sobre" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sobre
              </a>
              <a href="#contato" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
              {broker.phone && (
                <Button size="sm" style={{ backgroundColor: primaryColor }}>
                  <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-white">
                    Agendar Visita
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div 
        className="relative min-h-[60vh] flex items-center justify-center text-white"
        style={{
          backgroundImage: broker.cover_url ? `url(${broker.cover_url})` : 'url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}CC, ${primaryColor}99)`
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Encontre Sua Casa dos Sonhos
          </h1>
          <p className="text-xl mb-8 text-white/90">
            {broker.bio || "Descubra imóveis excepcionais com nossa equipe especializada. Tornamos o processo de compra e venda simples, transparente e eficaz."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-foreground hover:bg-white/90">
              <a href="#imoveis">Ver Imóveis Disponíveis</a>
            </Button>
            {broker.phone && (
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                  Agendar Consulta
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Imóveis */}
      <section id="imoveis" className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {properties.length === 0 ? 'Nenhum imóvel disponível' : 'Imóveis em Destaque'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {properties.length === 0 
              ? 'Este corretor ainda não publicou imóveis ou eles não estão disponíveis no momento.'
              : `Descubra nossa seleção exclusiva de ${properties.length} ${properties.length === 1 ? 'propriedade' : 'propriedades'} premium, cuidadosamente escolhidas para atender aos mais altos padrões de qualidade.`
            }
          </p>
        </div>

        {properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Card key={property.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg">
                <Link to={`/imovel/${property.id}`} className="block">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {property.fotos && property.fotos.length > 0 ? (
                      <img
                        src={property.fotos[0]}
                        alt={property.titulo}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                        <Building2 className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-4 left-4">
                      <Badge 
                        className="text-white border-0 font-semibold px-3 py-1"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {property.listing_type === 'venda' ? 'Venda' : 
                         property.listing_type === 'locacao' ? 'Locação' : 
                         property.listing_type || 'Imóvel'}
                      </Badge>
                    </div>
                    
                    {/* Action buttons overlay */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <Button
                        size="sm"
                        className="h-9 w-9 p-0 bg-white/90 hover:bg-white text-foreground shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          shareOnWhatsApp(property);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 w-9 p-0 bg-white/90 hover:bg-white text-foreground shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          shareProperty(property);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Price overlay */}
                    {typeof property.valor === 'number' && property.valor > 0 && (
                      <div className="absolute bottom-4 left-4">
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                          <div 
                            className="text-xl font-bold"
                            style={{ color: primaryColor }}
                          >
                            {property.valor.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL',
                              maximumFractionDigits: 0 
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                
                <CardContent className="p-6">
                  <Link to={`/imovel/${property.id}`} className="block">
                    <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                      {property.titulo}
                    </h3>
                  </Link>
                  
                  {(property.neighborhood || property.city) && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {property.descricao && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {property.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                    {property.quartos && (
                      <span className="flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        <span className="font-medium">{property.quartos}</span>
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="flex items-center gap-2">
                        <Bath className="h-4 w-4" />
                        <span className="font-medium">{property.bathrooms}</span>
                      </span>
                    )}
                    {property.area && (
                      <span className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        <span className="font-medium">{property.area}m²</span>
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 font-medium" 
                      size="sm"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => shareOnWhatsApp(property)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-4 border-2"
                      onClick={() => shareProperty(property)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Seção Sobre */}
      {minisiteConfig?.show_about && (
        <section id="sobre" className="bg-muted/30 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Sobre {broker.name || broker.username}</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                {broker.avatar_url ? (
                  <img 
                    src={broker.avatar_url} 
                    alt={broker.name || broker.username}
                    className="w-32 h-32 rounded-full object-cover shadow-xl" 
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center shadow-xl">
                    <Building2 className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {broker.bio || "Profissional dedicado ao mercado imobiliário, oferecendo atendimento personalizado e soluções ideais para cada cliente. Com expertise e comprometimento, ajudo você a encontrar o imóvel dos seus sonhos."}
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {broker.phone && (
                    <Button style={{ backgroundColor: primaryColor }}>
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${broker.phone}`} className="text-white">
                        {broker.phone}
                      </a>
                    </Button>
                  )}
                  {broker.email && (
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${broker.email}`}>
                        {broker.email}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Seção de Contato */}
      <section id="contato" className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Entre em Contato</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Pronto para encontrar seu próximo imóvel? Vamos conversar!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {broker.phone && (
              <Button size="lg" style={{ backgroundColor: primaryColor }}>
                <MessageCircle className="h-5 w-5 mr-2" />
                <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-white">
                  WhatsApp
                </a>
              </Button>
            )}
            {broker.phone && (
              <Button variant="outline" size="lg">
                <Phone className="h-5 w-5 mr-2" />
                <a href={`tel:${broker.phone}`}>
                  Ligar Agora
                </a>
              </Button>
            )}
            {broker.email && (
              <Button variant="outline" size="lg">
                <Mail className="h-5 w-5 mr-2" />
                <a href={`mailto:${broker.email}`}>
                  E-mail
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer 
        className="text-white py-8 mt-12"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}DD, ${primaryColor}99)`
        }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">
              {broker.name || `@${broker.username}`}
            </h3>
            <p className="text-white/90 mb-4">Corretor de Imóveis</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
              {broker.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{broker.phone}</span>
                </div>
              )}
              {broker.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{broker.email}</span>
                </div>
              )}
              {broker.creci && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>CRECI: {broker.creci}</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-white/70 text-xs">
                © 2024 ConectAIOS - Plataforma de Corretores de Imóveis
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}