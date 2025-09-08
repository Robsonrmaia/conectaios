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
  bio?: string;
  status?: string;
  phone?: string;
  email?: string;
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
        .select("id, user_id, username, name, avatar_url, bio, status, phone, email, creci")
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

      {/* Header do Corretor */}
      <div 
        className="text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {broker.avatar_url ? (
              <img 
                src={broker.avatar_url} 
                alt={broker.name || broker.username}
                className="w-20 h-20 rounded-full object-cover border-4 border-white/20" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {broker.name || `@${broker.username}`}
              </h1>
              <p className="text-white/90 mb-2">Corretor de Imóveis</p>
              {broker.bio && <p className="text-white/80 text-sm">{broker.bio}</p>}
              <div className="flex gap-4 mt-3">
                {broker.phone && (
                  <Button variant="secondary" size="sm" asChild>
                    <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                )}
                {broker.email && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <a href={`mailto:${broker.email}`}>
                      E-mail
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contador e Grid de Imóveis */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {properties.length === 0 ? 'Nenhum imóvel disponível' : 
             properties.length === 1 ? '1 Imóvel Disponível' : 
             `${properties.length} Imóveis Disponíveis`}
          </h2>
          {properties.length === 0 && (
            <p className="text-muted-foreground">
              Este corretor ainda não publicou imóveis ou eles não estão disponíveis no momento.
            </p>
          )}
        </div>

        {properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <Link to={`/imovel/${property.id}`} className="block">
                  <div className="aspect-video bg-muted relative">
                    {property.fotos && property.fotos.length > 0 ? (
                      <img
                        src={property.fotos[0]}
                        alt={property.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge 
                        className="text-white border-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {property.listing_type === 'venda' ? 'Venda' : 
                         property.listing_type === 'locacao' ? 'Locação' : 
                         property.listing_type || 'Imóvel'}
                      </Badge>
                    </div>
                    
                    {/* Action buttons overlay */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          shareOnWhatsApp(property);
                        }}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          shareProperty(property);
                        }}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Link>
                
                <CardContent className="p-4">
                  <Link to={`/imovel/${property.id}`} className="block">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {property.titulo}
                    </h3>
                  </Link>
                  
                  {property.descricao && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {property.descricao}
                    </p>
                  )}
                  
                  {typeof property.valor === 'number' && property.valor > 0 && (
                    <div 
                      className="text-2xl font-bold mb-3"
                      style={{ color: primaryColor }}
                    >
                      {property.valor.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        maximumFractionDigits: 0 
                      })}
                    </div>
                  )}
                  
                  {(property.neighborhood || property.city) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-4 text-sm text-muted-foreground mb-3">
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

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      size="sm"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => shareOnWhatsApp(property)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-3"
                      onClick={() => shareProperty(property)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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