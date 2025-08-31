import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/AnimatedCard';
import PageWrapper from '@/components/PageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Search, Filter, MapPin, Bath, Bed, Car, User, Phone, Mail, ExternalLink, Heart, MessageSquare, Share2, Eye } from 'lucide-react';
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
  listing_type: string;
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

  const handleContactBroker = (brokerName: string) => {
    toast({
      title: "Contatar Corretor",
      description: `Entrando em contato com ${brokerName}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-48 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary/10 to-brand-secondary/10 rounded-xl p-8 overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Marketplace de Imóveis
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              Conecte-se com outros corretores e descubra oportunidades exclusivas. 
              Encontre o imóvel perfeito para seus clientes em nossa rede colaborativa.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{filteredProperties.length} imóveis disponíveis</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>Rede de corretores</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>Sistema de matches</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card rounded-lg border"
        >
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
              <SelectItem value="residencial">Residencial</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="temporada">Temporada</SelectItem>
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
        </motion.div>

        {/* Properties Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
        >
          {filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AnimatedCard className="h-full overflow-hidden">
                <div className="relative">
                  <img 
                    src={property.fotos?.[0] || '/placeholder.svg'} 
                    alt={property.titulo}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
                    <Badge variant="secondary" className="text-xs">
                      {property.listing_type === 'venda' ? 'Venda' : 
                       property.listing_type === 'aluguel' ? 'Aluguel' : 'Temporada'}
                    </Badge>
                  </div>
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

                  <div className="flex gap-2 mt-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="sm" 
                        onClick={() => handleContactBroker(property.profiles?.nome || 'Corretor')}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white transition-all duration-300"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Contato
                      </Button>
                    </motion.div>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition-colors duration-200"
                    >
                      <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors duration-200"
                    >
                      <MessageSquare className="h-4 w-4 text-gray-600 hover:text-blue-500" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="p-2 rounded-full bg-gray-100 hover:bg-green-100 transition-colors duration-200"
                    >
                      <Share2 className="h-4 w-4 text-gray-600 hover:text-green-500" />
                    </motion.button>
                  </div>
                </CardContent>
              </AnimatedCard>
            </motion.div>
          ))}
        </motion.div>

        {filteredProperties.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou aguarde novos imóveis serem publicados
            </p>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}