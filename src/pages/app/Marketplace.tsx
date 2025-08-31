import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, Filter, MapPin, Bath, Bed, Car, User, Phone, Mail, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
  user_id: string;
  created_at: string;
  profiles?: {
    nome: string;
  };
}

export default function Marketplace() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [finalidadeFilter, setFinalidadeFilter] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  useEffect(() => {
    fetchPublicProperties();
  }, []);

  const fetchPublicProperties = async () => {
    try {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Fetch profiles for each property
      const propertiesWithProfiles = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome')
            .eq('user_id', property.user_id)
            .single();
          
          return {
            ...property,
            profiles: profileData
          };
        })
      );

      setProperties(propertiesWithProfiles);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imóveis do marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFinalidade = !finalidadeFilter || finalidadeFilter === 'todas' || property.finalidade === finalidadeFilter;
    const matchesMinValue = !minValue || property.valor >= parseFloat(minValue);
    const matchesMaxValue = !maxValue || property.valor <= parseFloat(maxValue);

    return matchesSearch && matchesFinalidade && matchesMinValue && matchesMaxValue;
  });

  const handleContactBroker = (property: Property) => {
    // This would typically open a contact modal or redirect to broker profile
    toast({
      title: "Contatar Corretor",
      description: `Entrando em contato com ${property.profiles?.nome}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            Marketplace de Imóveis
          </h1>
          <p className="text-muted-foreground">
            Explore imóveis disponibilizados por outros corretores da rede
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredProperties.length} imóveis disponíveis
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card rounded-lg border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={finalidadeFilter} onValueChange={setFinalidadeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Finalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="locacao">Locação</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Valor mínimo"
          type="number"
          value={minValue}
          onChange={(e) => setMinValue(e.target.value)}
        />

        <Input
          placeholder="Valor máximo"
          type="number"
          value={maxValue}
          onChange={(e) => setMaxValue(e.target.value)}
        />
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
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
              <CardDescription className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Por: {property.profiles?.nome || 'Corretor'}
              </CardDescription>
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
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {property.descricao}
                </p>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleContactBroker(property)}
                  className="flex-1 bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contatar
                </Button>
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou aguarde novos imóveis serem publicados
          </p>
        </div>
      )}
    </div>
  );
}