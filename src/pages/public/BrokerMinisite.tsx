import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Bed, Bath, Square } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

export default function BrokerMinisite() {
  const { username } = useParams();
  const cleanUsername = (username ?? "").replace(/^@+/, "");

  const [broker, setBroker] = useState<Broker | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const debug = new URLSearchParams(location.search).get("debug") === "1";

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      const log = (...args: any[]) => { if (debug) console.log("[minisite]", ...args); };

      try {
        // 1) Busca corretor por username na TABELA CERTA
        log("🔍 Buscando corretor:", cleanUsername);
        const { data: b, error: bErr } = await supabase
          .from("conectaios_brokers")
          .select("id, user_id, username, name, avatar_url, bio, status, phone, email")
          .eq("username", cleanUsername)
          .eq("status", "active")
          .maybeSingle();

        if (bErr) {
          log("❌ Erro ao buscar broker:", bErr);
          if (!mounted) return;
          setLoading(false);
          return;
        }
        
        log("✅ Broker encontrado:", b);
        if (!mounted) return;
        setBroker(b ?? null);

        if (!b) {
          log("❌ Nenhum broker encontrado");
          if (!mounted) return;
          setLoading(false);
          return;
        }

        // 2) Busca imóveis públicos do corretor na TABELA CERTA usando user_id
        log("🏠 Buscando propriedades para user_id:", b.user_id);
        const { data: props, error: propsErr } = await supabase
          .from("conectaios_properties")
          .select("id, titulo, valor, fotos, city, neighborhood, quartos, bathrooms, area, user_id, listing_type, property_type, descricao")
          .eq("user_id", b.user_id)
          .eq("is_public", true)
          .eq("visibility", "public_site")
          .order("updated_at", { ascending: false });

        if (propsErr) {
          log("❌ Erro ao buscar propriedades:", propsErr);
        } else {
          log("✅ Propriedades encontradas:", props?.length || 0);
          if (props && props.length > 0) {
            log("📋 Primeira propriedade:", props[0]);
          }
        }

        if (!mounted) return;
        setProperties(props ?? []);
        setLoading(false);
      } catch (error) {
        log("💥 Erro geral:", error);
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [cleanUsername, debug]);

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
      {/* Header do Corretor */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white">
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
                  <Button variant="outline" size="sm" asChild>
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
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  {property.fotos && property.fotos.length > 0 ? (
                    <img
                      src={property.fotos[0]}
                      alt={property.titulo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/90 text-primary-foreground">
                      {property.listing_type === 'venda' ? 'Venda' : 
                       property.listing_type === 'locacao' ? 'Locação' : 
                       property.listing_type || 'Imóvel'}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {property.titulo}
                  </h3>
                  
                  {typeof property.valor === 'number' && property.valor > 0 && (
                    <div className="text-2xl font-bold text-primary mb-3">
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
                  
                  <div className="flex gap-4 text-sm text-muted-foreground">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}