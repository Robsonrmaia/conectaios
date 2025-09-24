import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Bed, Bath, Square, MessageCircle, Share2, Phone, Mail, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PropertySearch, SearchFilters } from "@/components/PropertySearch";
import { MinisiteDebugPanel } from "@/components/MinisiteDebugPanel";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";

type Broker = {
  id: string;
  user_id: string;
  username: string;
  name: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  status?: string;
  phone?: string;
  email?: string;
  creci?: string;
  region_id?: string;
  regions?: {
    name: string;
    state: string;
  } | null;
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
  parking_spots?: number;
  area?: number;
  user_id?: string;
  listing_type?: string;
  property_type?: string;
  descricao?: string;
  address?: string;
  state?: string;
  zipcode?: string;
  condominium_fee?: number;
  iptu?: number;
  reference_code?: string;
  created_at?: string;
  furnishing_type?: string;
  sea_distance?: number;
  has_sea_view?: boolean;
  year_built?: number;
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
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [minisiteConfig, setMinisiteConfig] = useState<MinisiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [errs, setErrs] = useState<string[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
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
      
      console.log('🚀 BrokerMinisite: Starting data fetch for username:', cleanUsername);

      // 1) Busca corretor por username na TABELA CERTA (only public-safe fields)
      const bq = await supabase
        .from("conectaios_brokers")
        .select("id, user_id, username, name, avatar_url, cover_url, bio, status, phone, email, creci, region_id")
        .eq("username", cleanUsername)
        .maybeSingle();

      console.log('📊 Broker query result:', {
        found: !!bq.data,
        error: bq.error,
        username: cleanUsername,
        data: bq.data ? {
          id: bq.data.id,
          user_id: bq.data.user_id,
          name: bq.data.name,
          status: bq.data.status
        } : null
      });

      if (bq.error) {
        console.error('❌ Broker query error:', bq.error);
        pushErr("broker.query", bq.error);
      }
      if (!mounted) return;

      if (!bq.data) {
        console.warn('⚠️ No broker found for username:', cleanUsername);
        setBroker(null);
        setProperties([]);
        setLoading(false);
        return;
      }

      let brokerWithRegion: Broker = bq.data;
      
      // Buscar dados da região se region_id existir
      if (bq.data.region_id) {
        const { data: regionData, error: regionErr } = await supabase
          .from("regions")
          .select("name, state")
          .eq("id", bq.data.region_id)
          .maybeSingle();
        
        if (regionErr) {
          pushErr("region.query", regionErr);
        } else if (regionData) {
          brokerWithRegion = { ...bq.data, regions: regionData };
        }
      }
      
      setBroker(brokerWithRegion);

      // 2) Propriedades PÚBLICAS - Query melhorada para minisite
      console.log('🔍 Fetching properties for user_id:', bq.data.user_id);
      console.log('🔍 Broker username:', cleanUsername);
      
      try {
        const { data: props, error: propsErr } = await supabase
          .from("properties")
          .select(`
            id, titulo, valor, quartos, bathrooms, area, fotos, 
            property_type, listing_type, finalidade, descricao, address,
            neighborhood, city, state, features, parking_spots, created_at, updated_at,
            is_public, visibility, status
          `)
          .eq("user_id", bq.data.user_id)
          .eq("is_public", true)
          .eq("visibility", "public_site")
          .neq("status", "INATIVO")
          .order("created_at", { ascending: false })
          .limit(50);

        console.log('🎯 Properties query result:', {
          found: props?.length || 0,
          error: propsErr,
          user_id: bq.data.user_id,
          broker_username: cleanUsername,
          properties_sample: props?.slice(0, 3).map(p => ({
            id: p.id,
            titulo: p.titulo,
            is_public: p.is_public,
            visibility: p.visibility,
            status: p.status
          })),
          query_details: {
            table: 'properties',
            filters: {
              user_id: bq.data.user_id,
              is_public: true,
              visibility: 'public_site',
              status_not: 'INATIVO'
            }
          }
        });

        if (propsErr) {
          console.error('❌ Properties query error:', propsErr);
          pushErr("properties.query", propsErr);
          // Continue with empty array
        }
        
        // Validate properties data
        const validProps = (props || []).filter(p => p && p.id && p.titulo);
        console.log('✅ Valid properties after filtering:', validProps.length);
        
        if (!mounted) return;
        setProperties(validProps);
        
      } catch (error) {
        console.error('❌ Properties fetch error:', error);
        pushErr("properties.fetch", error);
        if (!mounted) return;
        setProperties([]);
      }

      // 3) Buscar configuração do minisite
      const { data: config, error: configErr } = await supabase
        .from("minisite_configs")
        .select("id, primary_color, secondary_color, show_contact_form, show_about, template_id")
        .eq("broker_id", bq.data.id)
        .maybeSingle();

      if (configErr) pushErr("minisite_configs.query", configErr);
      
      if (!mounted) return;
      setMinisiteConfig(config);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [cleanUsername]);

  // Search and filter functions
  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...properties];

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(property => 
        property.titulo.toLowerCase().includes(query) ||
        property.descricao?.toLowerCase().includes(query) ||
        property.neighborhood?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query)
      );
    }

    // Price filter
    if (filters.minPrice) {
      filtered = filtered.filter(property => 
        (property.valor || 0) >= parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => 
        (property.valor || 0) <= parseFloat(filters.maxPrice)
      );
    }

    // Bedrooms filter
    if (filters.bedrooms && filters.bedrooms !== "all") {
      const bedrooms = parseInt(filters.bedrooms);
      if (bedrooms === 4) {
        filtered = filtered.filter(property => (property.quartos || 0) >= 4);
      } else {
        filtered = filtered.filter(property => (property.quartos || 0) === bedrooms);
      }
    }

    // Bathrooms filter
    if (filters.bathrooms && filters.bathrooms !== "all") {
      const bathrooms = parseInt(filters.bathrooms);
      if (bathrooms === 3) {
        filtered = filtered.filter(property => (property.bathrooms || 0) >= 3);
      } else {
        filtered = filtered.filter(property => (property.bathrooms || 0) === bathrooms);
      }
    }

    // Property type filter
    if (filters.propertyType && filters.propertyType !== "all") {
      filtered = filtered.filter(property => 
        property.property_type === filters.propertyType
      );
    }

    // Listing type filter
    if (filters.listingType && filters.listingType !== "all") {
      filtered = filtered.filter(property => 
        property.listing_type === filters.listingType
      );
    }

    setFilteredProperties(filtered);
    setSearchVisible(false);
  };

  const handleClearSearch = () => {
    setFilteredProperties(properties);
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
  };

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
    <div className="min-h-screen bg-background antialiased">
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

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-white" style={{ backgroundColor: primaryColor }}>
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">{broker.name || `@${broker.username}`}</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="hover:opacity-70 transition">Início</a>
              <a href="#imoveis" className="hover:opacity-70 transition">Imóveis</a>
              <a href="#sobre" className="hover:opacity-70 transition">Sobre</a>
              <a href="#contato" className="hover:opacity-70 transition">Contato</a>
            </div>
            <div className="flex items-center gap-2">
              <PropertySearch 
                onSearch={handleSearch}
                onClear={handleClearSearch}
                isVisible={searchVisible}
                onToggle={toggleSearch}
              />
              {broker.phone && (
                <Button className="hidden md:inline-flex" style={{ backgroundColor: primaryColor }}>
                  <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-white">
                    Fale Conosco
                  </a>
                </Button>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="inicio" className="pt-28 pb-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-700 text-sm mb-4">
              <Building2 className="h-4 w-4" />
              Atendimento humano com tecnologia
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-4">
              Encontre sua próxima casa com quem entende do mercado
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {broker.bio || "Selecionamos oportunidades reais e acompanhamos você em cada etapa: da visita à assinatura. Transparência, segurança e velocidade."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="text-white" style={{ backgroundColor: primaryColor }}>
                <a href="#imoveis">Ver imóveis</a>
              </Button>
              {broker.phone && (
                <Button variant="outline" size="lg" className="hover:border-blue-400 hover:text-blue-700">
                  <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    Quero ser atendido
                  </a>
                </Button>
              )}
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Badge className="w-4 h-4 rounded-full text-white border-0" style={{ backgroundColor: primaryColor }}>✓</Badge>
                Documentação revisada
              </div>
              <div className="flex items-center gap-2">
                <Badge className="w-4 h-4 rounded-full text-white border-0" style={{ backgroundColor: primaryColor }}>⏱</Badge>
                Resposta rápida
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              src={broker.cover_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"}
              alt="Imóvel em destaque" 
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Destaque</p>
                <p className="font-semibold">Novos lançamentos disponíveis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Imóveis */}
      <section id="imoveis" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {filteredProperties.length === 0 && properties.length > 0
                    ? 'Nenhum imóvel encontrado'
                    : properties.length === 0 
                    ? 'Nenhum imóvel disponível' 
                    : 'Imóveis em destaque'}
                </h2>
                <p className="text-gray-600">
                  {filteredProperties.length === 0 && properties.length > 0
                    ? 'Tente ajustar os filtros de pesquisa para encontrar mais imóveis.'
                    : properties.length === 0 
                    ? 'Este corretor ainda não publicou imóveis ou eles não estão disponíveis no momento.'
                    : `${(filteredProperties.length > 0 ? filteredProperties : properties).length} imóvel${(filteredProperties.length > 0 ? filteredProperties : properties).length !== 1 ? 'is' : ''} encontrado${(filteredProperties.length > 0 ? filteredProperties : properties).length !== 1 ? 's' : ''}.`
                  }
                </p>
              </div>
              {(filteredProperties.length > 0 || properties.length > 0) && (
                <Button variant="outline" className="hidden sm:inline-flex items-center gap-2 hover:border-blue-400 hover:text-blue-700">
                  <a href="#contato">Ver todos</a>
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>

              {/* Exibir imóveis ou mensagem de fallback */}
              {properties.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Procurando por algo específico?
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    Este corretor pode ter o imóvel que você procura. Use a pesquisa acima ou entre em contato diretamente.
                  </p>
                  <PropertySearch 
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    isVisible={true}
                    onToggle={() => {}}
                  />
                  {broker.phone && (
                    <div className="mt-8">
                      <Button className="text-white" style={{ backgroundColor: primaryColor }}>
                        <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                          Entrar em contato
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(filteredProperties.length > 0 ? filteredProperties : properties).map((property) => (
                <article key={property.id} className="rounded-2xl overflow-hidden border bg-white hover:shadow-xl transition-all duration-300">
                  <div className="relative">
                    {property.fotos && property.fotos.length > 0 ? (
                      <img
                        src={property.fotos[0]}
                        alt={property.titulo}
                        className="w-full h-56 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-56 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                        <Building2 className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="px-3 py-1 text-xs rounded-full bg-white/90 text-gray-800">
                        {property.listing_type === 'venda' ? 'Venda' : 
                         property.listing_type === 'locacao' ? 'Locação' : 
                         property.listing_type || 'Disponível'}
                      </Badge>
                    </div>
                    
                    {/* Action buttons overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-foreground shadow-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          shareOnWhatsApp(property);
                        }}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-foreground shadow-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          shareProperty(property);
                        }}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <Link to={`/imovel/${property.id}`} className="block">
                      <h3 className="font-semibold text-lg hover:text-blue-700 transition-colors">
                        {property.titulo}
                      </h3>
                    </Link>
                    
                    {property.descricao && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {property.descricao}
                      </p>
                    )}
                    
                    {(property.neighborhood || property.city) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between">
                      {typeof property.valor === 'number' && property.valor > 0 ? (
                        <span className="font-bold text-blue-700">
                          {property.valor.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            maximumFractionDigits: 0 
                          })}
                        </span>
                      ) : (
                        <span className="font-bold text-blue-700">Consulte valor</span>
                      )}
                      <Link 
                        to={`/imovel/${property.id}`} 
                        className="text-sm inline-flex items-center gap-1 hover:text-blue-700 transition-colors"
                      >
                        Detalhes <Share2 className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
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
                  </div>
                </article>
                  ))}
                </div>
              )}
              
              {/* Debug info - visível apenas com ?debug=1 */}
              {debug && properties.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="font-semibold text-red-800 mb-2">Debug - Nenhum imóvel encontrado</h4>
                  <div className="text-sm text-red-700 space-y-1">
                    <p>Broker ID: <code>{broker.id}</code></p>
                    <p>User ID: <code>{broker.user_id}</code></p>
                    <p>Username: <code>{broker.username}</code></p>
                    <p>Query executada: properties WHERE user_id = '{broker.user_id}' AND is_public = true AND visibility = 'public_site'</p>
                    {errs.length > 0 && (
                      <div>
                        <p className="font-semibold mt-2">Erros encontrados:</p>
                        <ul className="list-disc list-inside">
                          {errs.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
        </div>
      </section>

      {/* Seção Sobre */}
      <section id="sobre" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-14">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Seu parceiro imobiliário de confiança
              </h2>
              <p className="text-gray-600 mb-6">
                {broker.bio || "Atuamos com foco em orientação, análise documental e negociação estratégica. Aqui você não recebe apenas 'links de imóveis', recebe acompanhamento de ponta a ponta."}
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Badge className="mt-0.5 w-5 h-5 rounded-full text-white border-0" style={{ backgroundColor: primaryColor }}>
                    ✓
                  </Badge>
                  Curadoria de oportunidades e avaliação justa
                </li>
                <li className="flex items-start gap-3">
                  <Badge className="mt-0.5 w-5 h-5 rounded-full text-white border-0" style={{ backgroundColor: primaryColor }}>
                    ✓
                  </Badge>
                  Segurança jurídica e transparência
                </li>
                <li className="flex items-start gap-3">
                  <Badge className="mt-0.5 w-5 h-5 rounded-full text-white border-0" style={{ backgroundColor: primaryColor }}>
                    ✓
                  </Badge>
                  Processo ágil com tecnologia
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              {broker.avatar_url ? (
                <img 
                  className="rounded-2xl w-full max-w-sm h-80 object-cover shadow-xl" 
                  src={broker.avatar_url}
                  alt={broker.name || broker.username} 
                />
              ) : (
                <div className="rounded-2xl w-full max-w-sm h-80 bg-muted flex items-center justify-center shadow-xl">
                  <Building2 className="h-20 w-20 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-white text-center">
              <div className="text-3xl font-extrabold mb-2" style={{ color: primaryColor }}>
                {properties.length}+
              </div>
              <p className="text-gray-600">Imóveis disponíveis</p>
            </div>
            <div className="p-6 rounded-2xl border bg-white text-center">
              <div className="text-3xl font-extrabold mb-2" style={{ color: primaryColor }}>
                100%
              </div>
              <p className="text-gray-600">Acompanhamento dedicado</p>
            </div>
            <div className="p-6 rounded-2xl border bg-white text-center">
              <div className="text-3xl font-extrabold mb-2" style={{ color: primaryColor }}>
                24h
              </div>
              <p className="text-gray-600">Tempo médio de resposta</p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Contato */}
      <section id="contato" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Fale com a gente</h2>
              <p className="text-gray-600 mb-8">Conte o que você procura e retornamos com as melhores opções.</p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Localização</p>
                     <p className="text-sm text-gray-600">
                       {broker?.regions ? `${broker.regions.name}, ${broker.regions.state}` : 'Brasil'}
                     </p>
                  </div>
                </div>

                {broker.phone && (
                  <div className="flex items-center gap-4 text-gray-700">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Telefone</p>
                      <a href={`tel:${broker.phone}`} className="text-sm text-gray-600 hover:text-blue-700">
                        {broker.phone}
                      </a>
                    </div>
                  </div>
                )}

                {broker.email && (
                  <div className="flex items-center gap-4 text-gray-700">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">E-mail</p>
                      <a href={`mailto:${broker.email}`} className="text-sm text-gray-600 hover:text-blue-700">
                        {broker.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                {broker.phone && (
                  <Button size="lg" className="text-white" style={{ backgroundColor: primaryColor }}>
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

            <div className="rounded-2xl overflow-hidden border shadow-lg">
              <iframe 
                title="Localização" 
                width="100%" 
                height="400" 
                style={{ border: 0 }} 
                loading="lazy" 
                allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  broker?.regions 
                    ? `${broker.regions.name}, ${broker.regions.state}, Brasil`
                    : 'Brasil'
                )}&output=embed`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid sm:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white" style={{ backgroundColor: primaryColor }}>
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="font-semibold text-lg">{broker.name || `@${broker.username}`}</span>
              </div>
              <p className="text-gray-600 mb-4">
                {broker.bio || "Atendimento consultivo, seleção de oportunidades e segurança na negociação."}
              </p>
              
              {/* Informações do corretor */}
              <div className="space-y-2 text-sm text-gray-700">
                {broker.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                    <span>{broker.phone}</span>
                  </div>
                )}
                {broker.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" style={{ color: primaryColor }} />
                    <span>{broker.email}</span>
                  </div>
                )}
                {broker.creci && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" style={{ color: primaryColor }} />
                    <span>CRECI: {broker.creci}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#inicio" className="hover:text-blue-700 transition-colors">Início</a></li>
                <li><a href="#imoveis" className="hover:text-blue-700 transition-colors">Imóveis</a></li>
                <li><a href="#sobre" className="hover:text-blue-700 transition-colors">Sobre</a></li>
                <li><a href="#contato" className="hover:text-blue-700 transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <div className="space-y-3">
                {broker.phone && (
                  <Button className="w-full justify-start" style={{ backgroundColor: primaryColor }}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-white">
                      WhatsApp
                    </a>
                  </Button>
                )}
                {broker.email && (
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${broker.email}`}>
                      E-mail
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t text-sm text-gray-500 flex flex-wrap items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} {broker.name || broker.username}. Todos os direitos reservados.</span>
            <span>Powered by ConectAIOS</span>
          </div>
        </div>
      </footer>
      
      {/* WhatsApp Floating Button */}
      {broker.phone && (
        <WhatsAppButton 
          phone={broker.phone}
          message={`Olá! Vi seu minisite e tenho interesse em seus imóveis. Poderia me ajudar?`}
          showOnScroll={true}
        />
      )}

      // Property Detail Modal
      {selectedProperty && (
        <PropertyDetailModal
          property={{
            ...selectedProperty,
            created_at: selectedProperty.created_at || new Date().toISOString(),
            valor: selectedProperty.valor || 0,
            area: selectedProperty.area || 0,
            quartos: selectedProperty.quartos || 0,
            fotos: selectedProperty.fotos || [],
            listing_type: selectedProperty.listing_type || 'venda'
          }}
          broker={{
            ...broker,
            name: broker.name || broker.username
          }}
          open={!!selectedProperty}
          onOpenChange={(open) => !open && setSelectedProperty(null)}
          primaryColor={primaryColor}
        />
      )}

      {/* Debug Panel Component */}
      <MinisiteDebugPanel
        broker={broker}
        properties={properties}
        errors={errs}
        config={minisiteConfig}
      />
    </div>
  );
}