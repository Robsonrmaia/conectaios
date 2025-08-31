import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Heart, X, Sparkles, User, MapPin, Bed, Bath, Car, Home, Plus, Target, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms: number;
  parking_spots: number;
  listing_type: string;
  property_type: string;
  visibility: string;
  descricao: string;
  fotos: string[];
  address?: string;
  neighborhood?: string;
  city?: string;
  user_id: string;
}

interface Client {
  id: string;
  nome: string;
  telefone: string;
  tipo: string;
}

interface MatchResult {
  property_id: string;
  match_score: number;
  property_data: Property;
}

interface ClientPreferences {
  min_price: number;
  max_price: number;
  min_area: number;
  max_area: number;
  bedrooms: number;
  property_type: string;
  neighborhoods: string[];
  [key: string]: any;
}

export default function Match() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [preferences, setPreferences] = useState<ClientPreferences>({
    min_price: 0,
    max_price: 1000000,
    min_area: 0,
    max_area: 500,
    bedrooms: 2,
    property_type: 'apartamento',
    neighborhoods: []
  });

  useEffect(() => {
    if (user) {
      fetchClients();
      findMatches();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const findMatches = async (clientPrefs?: ClientPreferences) => {
    try {
      setLoading(true);
      const prefs = clientPrefs || preferences;
      
      // Call the match engine function
      const { data, error } = await supabase.rpc('find_property_matches', {
        client_preferences: prefs
      });

      if (error) throw error;
      
      setMatches(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (matches.length === 0) return;
    
    const currentMatch = matches[currentIndex];
    
    toast({
      title: "Match salvo!",
      description: `${currentMatch.property_data.titulo} foi salvo nos seus matches`,
    });
    
    nextMatch();
  };

  const handlePass = () => {
    nextMatch();
  };

  const nextMatch = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more matches
      toast({
        title: "Fim dos matches",
        description: "Não há mais imóveis para mostrar",
      });
    }
  };

  const createDeal = async (propertyId: string) => {
    if (!selectedClient) {
      toast({
        title: "Selecione um cliente",
        description: "Escolha um cliente para criar o deal",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('deals')
        .insert({
          property_id: propertyId,
          client_id: selectedClient,
          buyer_broker_id: user?.id,
          offer_amount: matches[currentIndex].property_data.valor,
          commission_split: { buyer_broker: 50, seller_broker: 50 },
          status: 'proposta'
        });

      if (error) throw error;

      toast({
        title: "Deal criado!",
        description: "Deal criado com sucesso",
      });

      navigate('/app/deals');
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar deal",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleUpdatePreferences = () => {
    findMatches(preferences);
    setShowPreferences(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              Match IA
            </h1>
            <p className="text-muted-foreground">
              Encontre imóveis perfeitos para seus clientes
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Preferências
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Preferências</DialogTitle>
                <DialogDescription>
                  Ajuste os filtros para encontrar melhores matches
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Faixa de Preço</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Mín"
                      value={preferences.min_price}
                      onChange={(e) => setPreferences({...preferences, min_price: Number(e.target.value)})}
                    />
                    <Input
                      type="number"
                      placeholder="Máx"
                      value={preferences.max_price}
                      onChange={(e) => setPreferences({...preferences, max_price: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Área (m²)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Mín"
                      value={preferences.min_area}
                      onChange={(e) => setPreferences({...preferences, min_area: Number(e.target.value)})}
                    />
                    <Input
                      type="number"
                      placeholder="Máx"
                      value={preferences.max_area}
                      onChange={(e) => setPreferences({...preferences, max_area: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Quartos</Label>
                  <Select value={preferences.bedrooms.toString()} onValueChange={(value) => setPreferences({...preferences, bedrooms: Number(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 quarto</SelectItem>
                      <SelectItem value="2">2 quartos</SelectItem>
                      <SelectItem value="3">3 quartos</SelectItem>
                      <SelectItem value="4">4+ quartos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Imóvel</Label>
                  <Select value={preferences.property_type} onValueChange={(value) => setPreferences({...preferences, property_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowPreferences(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdatePreferences} className="flex-1">
                    Buscar Matches
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum match encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Ajuste as preferências para encontrar imóveis compatíveis
          </p>
          <Button onClick={() => setShowPreferences(true)}>
            <Target className="h-4 w-4 mr-2" />
            Configurar Preferências
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              {currentIndex + 1} de {matches.length} matches
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden max-w-2xl mx-auto">
                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge className={`${getScoreColor(currentMatch.match_score)} text-white`}>
                    {currentMatch.match_score}% Match
                  </Badge>
                </div>

                {/* Property Image */}
                <div className="aspect-video bg-muted relative">
                  {currentMatch.property_data.fotos?.[0] ? (
                    <img
                      src={currentMatch.property_data.fotos[0]}
                      alt={currentMatch.property_data.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <CardHeader>
                  <CardTitle className="text-xl">{currentMatch.property_data.titulo}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {currentMatch.property_data.neighborhood || currentMatch.property_data.city || 'Localização não informada'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-primary">
                    R$ {currentMatch.property_data.valor?.toLocaleString('pt-BR')}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{currentMatch.property_data.area}m²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{currentMatch.property_data.quartos} quartos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{currentMatch.property_data.bathrooms} banheiros</span>
                    </div>
                  </div>

                  {currentMatch.property_data.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {currentMatch.property_data.descricao}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentMatch.property_data.listing_type}</Badge>
                    <Badge variant="outline">{currentMatch.property_data.property_type}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={handlePass}
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              >
                <X className="h-5 w-5 mr-2" />
                Pular
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={handleLike}
                className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
              >
                <Heart className="h-5 w-5 mr-2" />
                Curtir
              </Button>
            </motion.div>

            <Dialog>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-brand-secondary">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Criar Deal
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Deal</DialogTitle>
                  <DialogDescription>
                    Selecione um cliente para criar o deal com este imóvel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cliente</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nome} - {client.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedClient && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">Resumo do Deal</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cliente: {clients.find(c => c.id === selectedClient)?.nome}<br />
                        Imóvel: {currentMatch.property_data.titulo}<br />
                        Valor: R$ {currentMatch.property_data.valor?.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => createDeal(currentMatch.property_id)}
                      className="flex-1"
                      disabled={!selectedClient}
                    >
                      Criar Deal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(matches.length - 1, currentIndex + 1))}
              disabled={currentIndex === matches.length - 1}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}