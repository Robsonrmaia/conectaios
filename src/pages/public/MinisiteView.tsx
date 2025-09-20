import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Phone, Mail, MessageCircle, MapPin, Clock, Star, Home, Volume2 } from 'lucide-react';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import { formatCurrency } from '@/lib/utils';

interface MinisiteConfig {
  id: string;
  broker_id: string;
  template_id: string;
  primary_color: string;
  secondary_color: string;
  title: string;
  description: string;
  phone: string;
  email: string;
  whatsapp: string;
  custom_message: string;
  show_properties: boolean;
  show_contact_form: boolean;
  show_about: boolean;
  config_data: any;
  generated_url: string;
  broker?: {
    name: string;
    bio: string;
    avatar_url: string;
    creci: string;
  };
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  quartos: number;
  area: number;
  fotos: string[];
  neighborhood: string;
  city: string;
  descricao: string;
  bathrooms: number;
  parking_spots: number;
}

export default function MinisiteView() {
  const { username } = useParams();
  const { speak, stop, isSpeaking } = useElevenLabsVoice();
  const [config, setConfig] = useState<MinisiteConfig | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: ''
  });

  useEffect(() => {
    if (username) {
      fetchMinisiteData();
    }
  }, [username]);

  const fetchMinisiteData = async () => {
    try {
      console.log('Fetching minisite for username:', username);
      const urlToFind = username?.startsWith('@') ? username : `@${username}`;
      console.log('Looking for URL:', urlToFind);
      
      // First, let's check what minisites exist in the database
      const { data: allMinisites, error: allError } = await supabase
        .from('minisite_configs')
        .select('generated_url, is_active, broker_id');
      
      console.log('All minisites in database:', allMinisites);
      console.log('All minisites error:', allError);
      
      // Fetch minisite config with broker data
      const { data: configData, error: configError } = await supabase
        .from('minisite_configs')
        .select(`
          *,
          broker:conectaios_brokers(name, bio, avatar_url, creci)
        `)
        .eq('generated_url', urlToFind)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Config data:', configData);
      console.log('Config error:', configError);

      if (configError) throw configError;
      
      if (!configData) {
        // Try alternative search without @ prefix
        const altUrlToFind = username?.startsWith('@') ? username.substring(1) : username;
        console.log('Trying alternative URL:', altUrlToFind);
        
        const { data: altConfigData, error: altConfigError } = await supabase
          .from('minisite_configs')
          .select(`
            *,
            broker:conectaios_brokers(name, bio, avatar_url, creci)
          `)
          .eq('generated_url', altUrlToFind)
          .eq('is_active', true)
          .maybeSingle();
        
        console.log('Alternative config data:', altConfigData);
        
        if (altConfigData) {
          setConfig(altConfigData);
        } else {
          throw new Error('Minisite não encontrado');
        }
      } else {
        setConfig(configData);
      }

      // Fetch broker's properties if show_properties is enabled
      if (configData?.show_properties && configData.broker_id) {
        console.log('Fetching properties for broker_id:', configData.broker_id);
        
        try {
          // First get broker info to find the correct user_id
          const { data: brokerData, error: brokerError } = await supabase
            .from('conectaios_brokers')
            .select('user_id')
            .eq('id', configData.broker_id)
            .single();

          if (brokerError) {
            console.error('Error fetching broker data:', brokerError);
            throw brokerError;
          }

          if (brokerData?.user_id) {
            console.log('Fetching properties for user_id:', brokerData.user_id);
            
            // Query properties with comprehensive error handling
            const { data: propertiesData, error: propertiesError } = await supabase
              .from('properties')
              .select(`
                id, titulo, valor, quartos, area, fotos, neighborhood, city, 
                descricao, bathrooms, parking_spots, listing_type, property_type,
                address, state, features, created_at, updated_at
              `)
              .eq('user_id', brokerData.user_id)
              .eq('is_public', true)
              .eq('visibility', 'public_site')
              .order('created_at', { ascending: false })
              .limit(12);

            console.log('🎯 MinisiteView Properties query completed:', {
              found: propertiesData?.length || 0,
              error: propertiesError,
              user_id: brokerData.user_id,
              broker_id: configData.broker_id,
              query_details: {
                table: 'properties',
                filters: {
                  user_id: brokerData.user_id,
                  is_public: true,
                  visibility: 'public_site'
                }
              }
            });

            if (propertiesError) {
              console.error('Error fetching properties:', propertiesError);
              // Don't throw error, just log it and continue with empty properties
              setProperties([]);
            } else {
              setProperties(propertiesData || []);
            }
          } else {
            console.warn('No user_id found for broker');
            setProperties([]);
          }
        } catch (error) {
          console.error('Error in properties fetch process:', error);
          setProperties([]);
        }
      } else {
        console.log('Properties disabled or no broker_id');
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching minisite data:', error);
      toast({
        title: "Erro",
        description: "Minisite não encontrado ou inativo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.nome || !contactForm.email || !contactForm.telefone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          nome: contactForm.nome,
          email: contactForm.email,
          telefone: contactForm.telefone,
          interesse: contactForm.mensagem || 'Contato via minisite',
          empresa: 'ConectAIOS Minisite'
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Sua mensagem foi enviada. O corretor entrará em contato em breve!",
      });

      setContactForm({ nome: '', email: '', telefone: '', mensagem: '' });
    } catch (error) {
      console.error('Error submitting contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = () => {
    if (config?.whatsapp) {
      const message = encodeURIComponent(`Olá! Vi seu minisite e gostaria de conversar sobre imóveis.`);
      window.open(`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando minisite...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Minisite não encontrado</h1>
          <p className="text-muted-foreground">O minisite que você está procurando não existe ou foi desativado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ '--primary': config.primary_color, '--secondary': config.secondary_color } as any}>
      {/* Header */}
      <header className="py-8 text-center" style={{ backgroundColor: config.primary_color }}>
        <div className="container mx-auto px-4">
          {config.broker?.avatar_url && (
            <img 
              src={config.broker.avatar_url} 
              alt={config.broker.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white"
            />
          )}
          <h1 className="text-4xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-white/90 text-lg">{config.description}</p>
          {config.broker && (
            <p className="text-white/80 mt-2">
              {config.broker.name} {config.broker.creci && `- CRECI: ${config.broker.creci}`}
            </p>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {config.show_about && config.broker?.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Sobre o Corretor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{config.broker.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Properties Section */}
            {config.show_properties && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Imóveis Disponíveis
                    {properties.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({properties.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                    <div className="text-center py-8">
                      <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum imóvel disponível</h3>
                      <p className="text-muted-foreground">
                        Este corretor ainda não publicou imóveis ou eles não estão disponíveis no momento.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {properties.map((property) => (
                      <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        {property.fotos?.[0] && (
                          <img 
                            src={property.fotos[0]} 
                            alt={property.titulo}
                            className="w-full h-48 object-cover rounded-md mb-3"
                          />
                        )}
                        <h3 className="font-semibold mb-2">{property.titulo}</h3>
                        <p className="text-lg font-bold text-primary mb-2">
                          {formatCurrency(property.valor)}
                        </p>
                        <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                          <span>{property.quartos} quartos</span>
                          <span>{property.area}m²</span>
                          <span>{property.bathrooms || 0} banheiros</span>
                          <span>{property.parking_spots || 0} vagas</span>
                        </div>
                        {(property.neighborhood || property.city) && (
                          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {property.neighborhood} {property.city && `- ${property.city}`}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (isSpeaking) {
                              stop();
                            } else {
                              const descricao = property.descricao || `Imóvel ${property.titulo} com valor de ${formatCurrency(property.valor)}, ${property.area} metros quadrados, ${property.quartos} quartos, ${property.bathrooms || 0} banheiros e ${property.parking_spots || 0} vagas de garagem.`;
                              speak(descricao);
                            }
                          }}
                          className="w-full"
                          title={isSpeaking ? "Parar reprodução" : "Ouvir descrição"}
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          {isSpeaking ? "Parar Áudio" : "Ouvir Descrição"}
                        </Button>
                      </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Custom Message */}
            {config.custom_message && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-lg italic">{config.custom_message}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{config.phone}</span>
                  </div>
                )}
                {config.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>{config.email}</span>
                  </div>
                )}
                {config.whatsapp && (
                  <Button 
                    onClick={openWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Contact Form */}
            {config.show_contact_form && (
              <Card>
                <CardHeader>
                  <CardTitle>Envie sua Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={contactForm.nome}
                        onChange={(e) => setContactForm(prev => ({ ...prev, nome: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={contactForm.telefone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, telefone: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="mensagem">Mensagem</Label>
                      <Textarea
                        id="mensagem"
                        value={contactForm.mensagem}
                        onChange={(e) => setContactForm(prev => ({ ...prev, mensagem: e.target.value }))}
                        placeholder="Como posso ajudá-lo?"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 border-t">
        <p className="text-muted-foreground">
          Minisite criado com <span className="text-primary">ConectAIOS</span>
        </p>
      </footer>
    </div>
  );
}