import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus, Eye, Trash2, Users, Building2, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

interface ClientSearch {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  max_price: number;
  min_bedrooms: number;
  neighborhood: string;
  city: string;
  min_area: number;
  created_at: string;
  matches_count: number;
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  quartos: number;
  area: number;
  neighborhood: string;
  city: string;
  property_type: string;
  listing_type: string;
}

export default function MinhasBuscas() {
  const { user } = useAuth();
  const [searches, setSearches] = useState<ClientSearch[]>([]);
  const [matches, setMatches] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<ClientSearch | null>(null);
  const [newSearch, setNewSearch] = useState({
    title: '',
    property_type: 'apartamento',
    listing_type: 'venda',
    max_price: '',
    min_bedrooms: '',
    neighborhood: '',
    city: '',
    min_area: ''
  });

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      // For now, we'll create mock data since we don't have the client_searches table yet
      const mockSearches: ClientSearch[] = [
        {
          id: '1',
          title: 'Casa para cliente João - até R$ 300k',
          property_type: 'casa',
          listing_type: 'venda',
          max_price: 300000,
          min_bedrooms: 3,
          neighborhood: 'Centro',
          city: 'Ilhéus',
          min_area: 80,
          created_at: new Date().toISOString(),
          matches_count: 2
        },
        {
          id: '2',
          title: 'Apartamento para aluguel - Casal jovem',
          property_type: 'apartamento',
          listing_type: 'aluguel',
          max_price: 2500,
          min_bedrooms: 2,
          neighborhood: 'Pontal',
          city: 'Ilhéus',
          min_area: 60,
          created_at: new Date().toISOString(),
          matches_count: 1
        }
      ];
      
      setSearches(mockSearches);
    } catch (error) {
      console.error('Error fetching searches:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar buscas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSearch = async () => {
    if (!newSearch.title || !newSearch.max_price) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      const searchData = {
        id: Date.now().toString(),
        ...newSearch,
        max_price: parseInt(newSearch.max_price),
        min_bedrooms: parseInt(newSearch.min_bedrooms) || 1,
        min_area: parseInt(newSearch.min_area) || 0,
        created_at: new Date().toISOString(),
        matches_count: 0
      };

      setSearches([...searches, searchData]);
      setNewSearch({
        title: '',
        property_type: 'apartamento',
        listing_type: 'venda',
        max_price: '',
        min_bedrooms: '',
        neighborhood: '',
        city: '',
        min_area: ''
      });
      setShowAddForm(false);
      
      toast({
        title: 'Sucesso',
        description: 'Busca criada com sucesso!'
      });
    } catch (error) {
      console.error('Error adding search:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar busca',
        variant: 'destructive'
      });
    }
  };

  const searchMatches = async (search: ClientSearch) => {
    try {
      setSelectedSearch(search);
      
      // Search for matching properties
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, titulo, valor, quartos, area, neighborhood, city, property_type, listing_type')
        .eq('is_public', true)
        .eq('listing_type', search.listing_type)
        .eq('property_type', search.property_type)
        .lte('valor', search.max_price)
        .gte('quartos', search.min_bedrooms)
        .gte('area', search.min_area || 0)
        .limit(10);

      if (error) throw error;
      
      setMatches(properties || []);
      
      toast({
        title: 'Busca realizada',
        description: `Encontrados ${properties?.length || 0} imóveis compatíveis`
      });
    } catch (error) {
      console.error('Error searching matches:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar matches',
        variant: 'destructive'
      });
    }
  };

  const deleteSearch = (searchId: string) => {
    setSearches(searches.filter(s => s.id !== searchId));
    toast({
      title: 'Sucesso',
      description: 'Busca removida com sucesso'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Buscas</h1>
          <p className="text-muted-foreground">
            Gerencie as buscas dos seus clientes e encontre matches automáticos
          </p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Busca
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Busca de Cliente</DialogTitle>
              <DialogDescription>
                Crie uma busca personalizada para seu cliente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Busca *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Casa para João - até R$ 300k"
                  value={newSearch.title}
                  onChange={(e) => setNewSearch({ ...newSearch, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="property_type">Tipo de Imóvel</Label>
                  <Select value={newSearch.property_type} onValueChange={(value) => setNewSearch({ ...newSearch, property_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="listing_type">Finalidade</Label>
                  <Select value={newSearch.listing_type} onValueChange={(value) => setNewSearch({ ...newSearch, listing_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="max_price">Valor Máximo *</Label>
                  <Input
                    id="max_price"
                    type="number"
                    placeholder="300000"
                    value={newSearch.max_price}
                    onChange={(e) => setNewSearch({ ...newSearch, max_price: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="min_bedrooms">Min. Quartos</Label>
                  <Input
                    id="min_bedrooms"
                    type="number"
                    placeholder="3"
                    value={newSearch.min_bedrooms}
                    onChange={(e) => setNewSearch({ ...newSearch, min_bedrooms: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Centro"
                    value={newSearch.neighborhood}
                    onChange={(e) => setNewSearch({ ...newSearch, neighborhood: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Ilhéus"
                    value={newSearch.city}
                    onChange={(e) => setNewSearch({ ...newSearch, city: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="min_area">Área Mínima (m²)</Label>
                <Input
                  id="min_area"
                  type="number"
                  placeholder="80"
                  value={newSearch.min_area}
                  onChange={(e) => setNewSearch({ ...newSearch, min_area: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleAddSearch} className="flex-1">
                  Criar Busca
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {searches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma busca criada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie buscas personalizadas para seus clientes e encontre imóveis compatíveis automaticamente
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Busca
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {searches.map((search) => (
            <Card key={search.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{search.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {search.property_type} - {search.listing_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        até {formatCurrency(search.max_price)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {search.min_bedrooms}+ quartos
                      </span>
                      {search.neighborhood && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {search.neighborhood}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {search.matches_count} matches
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => searchMatches(search)}
                    className="flex-1"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Matches
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteSearch(search.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Matches Results */}
      {selectedSearch && matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matches Encontrados</CardTitle>
            <CardDescription>
              Imóveis compatíveis com a busca: {selectedSearch.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {matches.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{property.titulo}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{property.quartos} quartos</span>
                      <span>{property.area}m²</span>
                      <span>{property.neighborhood}, {property.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg text-primary">
                      {formatCurrency(property.valor)}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {property.property_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}