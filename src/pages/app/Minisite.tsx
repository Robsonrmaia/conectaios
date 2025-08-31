import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Mail, MapPin, Bed, Bath, Car, Share2, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface BrokerProfile {
  nome: string;
  user_id: string;
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  finalidade: string;
  descricao: string;
  fotos: string[];
  videos: string[];
}

export default function Minisite() {
  const { brokerId } = useParams<{ brokerId: string }>();
  const [broker, setBroker] = useState<BrokerProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brokerId) {
      fetchBrokerData();
    }
  }, [brokerId]);

  const fetchBrokerData = async () => {
    try {
      // Fetch broker profile
      const { data: brokerData, error: brokerError } = await supabase
        .from('profiles')
        .select('nome, user_id')
        .eq('user_id', brokerId)
        .single();

      if (brokerError) throw brokerError;
      setBroker(brokerData);

      // Fetch broker's public properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', brokerId)
        .eq('is_public', true)
        .eq('broker_minisite_enabled', true)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
    } catch (error) {
      console.error('Error fetching broker data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do corretor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Imóveis de ${broker?.nome}`,
        text: `Confira os imóveis disponíveis de ${broker?.nome}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link copiado!",
          description: "O link do minisite foi copiado para a área de transferência",
        });
      });
    }
  };

  const handleContact = () => {
    toast({
      title: "Contatar Corretor",
      description: `Entrando em contato com ${broker?.nome}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Corretor não encontrado</h3>
            <p className="text-muted-foreground mb-4">
              O corretor solicitado não foi encontrado ou não possui minisite ativo
            </p>
            <Link to="/app/marketplace">
              <Button>Voltar ao Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-brand-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <h1 className="text-4xl font-bold mb-2">{broker.nome}</h1>
              <p className="text-xl opacity-90">Corretor de Imóveis</p>
              <Badge variant="secondary" className="mt-2">
                {properties.length} imóveis disponíveis
              </Badge>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="secondary" onClick={handleContact}>
                <Phone className="h-4 w-4 mr-2" />
                Contatar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Imóveis Disponíveis</h2>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum imóvel disponível</h3>
            <p className="text-muted-foreground">
              Este corretor ainda não possui imóveis disponíveis no minisite
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  {property.fotos?.[0] ? (
                    <img
                      src={property.fotos[0]}
                      alt={property.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground">
                    {property.finalidade === 'venda' ? 'Venda' : 'Locação'}
                  </Badge>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg">{property.titulo}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold text-primary">
                    R$ {property.valor?.toLocaleString('pt-BR')}
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {property.area}m²
                    </div>
                    <div className="flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      {property.quartos}
                    </div>
                  </div>

                  {property.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {property.descricao}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleContact}
                      className="flex-1 bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Interessado
                    </Button>
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-card border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              ConectaIOS
            </span>
          </div>
          <p className="text-muted-foreground">
            Plataforma de conexão entre corretores de imóveis
          </p>
        </div>
      </div>
    </div>
  );
}