import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, Eye, Trash2, Users, Building2, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

interface ClientSearch {
  id: string;
  title: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  property_type: string;
  listing_type: string;
  max_price: number;
  min_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  neighborhood?: string;
  city?: string;
  state?: string;
  min_area?: number;
  max_area?: number;
  is_active: boolean;
  last_match_at?: string;
  match_count: number;
  created_at: string;
  updated_at: string;
}

interface PropertyMatch {
  property_id: string;
  match_score: number;
  match_reasons: string[];
  property_data: {
    id: string;
    titulo: string;
    valor: number;
    quartos: number;
    area: number;
    neighborhood: string;
    city: string;
    property_type: string;
    listing_type: string;
    fotos?: string[];
  };
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
  match_score?: number;
  match_reasons?: string[];
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
      const { data: searchData, error } = await supabase
        .from('client_searches')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSearches(searchData || []);
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
      const { data: searchData, error } = await supabase
        .from('client_searches')
        .insert({
          user_id: user?.id,
          title: newSearch.title,
          property_type: newSearch.property_type,
          listing_type: newSearch.listing_type,
          max_price: parseFloat(newSearch.max_price.replace(/\./g, '').replace(',', '.')),
          min_bedrooms: parseInt(newSearch.min_bedrooms) || null,
          neighborhood: newSearch.neighborhood || null,
          city: newSearch.city || null,
          min_area: parseFloat(newSearch.min_area) || null,
          is_active: true,
          match_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setSearches([searchData, ...searches]);
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
      
      // Use intelligent property matching function
      const { data: matchResults, error } = await supabase
        .rpc('find_intelligent_property_matches', { search_id: search.id });

      if (error) {
        console.error('Search error:', error);
        // Fallback to broader search if intelligent matching fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('properties')
          .select('*')
          .eq('listing_type', search.listing_type)
          .lte('valor', search.max_price * 1.5) // 50% tolerance
          .eq('is_public', true)
          .limit(20);
        
        if (fallbackError) throw fallbackError;
        
        const transformedFallback: Property[] = (fallbackData || []).map((prop: any) => ({
          ...prop,
          match_score: 50,
          match_reasons: ['Busca ampliada - critérios flexíveis']
        }));
        
        setMatches(transformedFallback);
        toast({
          title: "Busca",
          description: `Encontrados ${transformedFallback.length} imóveis com critérios ampliados`
        });
        return;
      }

      // Transform match results to Property format
      const transformedMatches: Property[] = (matchResults || []).map((match: any) => ({
        ...match.property_data,
        match_score: match.match_score,
        match_reasons: match.match_reasons?.filter(Boolean) || []
      }));
      
      // If no matches found, suggest alternatives
      if (transformedMatches.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Nenhum match encontrado. Sugestão: amplie o orçamento ou revise os critérios."
        });
      }
      
      // Update match count in the search record
      await supabase
        .from('client_searches')
        .update({ 
          match_count: transformedMatches.length,
          last_match_at: new Date().toISOString()
        })
        .eq('id', search.id);

      // Update local state
      setSearches(prev => prev.map(s => 
        s.id === search.id 
          ? { ...s, match_count: transformedMatches.length, last_match_at: new Date().toISOString() }
          : s
      ));
      
      setMatches(transformedMatches);
      
      toast({
        title: 'Busca realizada',
        description: `Encontrados ${transformedMatches.length} imóveis compatíveis com pontuação inteligente`
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

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('client_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSearches(searches.filter(s => s.id !== searchId));
      toast({
        title: 'Sucesso',
        description: 'Busca removida com sucesso'
      });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover busca',
        variant: 'destructive'
      });
    }
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
            <Button className="px-3 sm:px-4 py-2 text-sm sm:text-base w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Busca
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
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
                    <CardDescription className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
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
                      {search.match_count} matches
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
                <div key={property.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">{property.titulo}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{property.quartos} quartos</span>
                        <span>{property.area}m²</span>
                        <span>{property.neighborhood}, {property.city}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-primary">
                        {formatCurrency(property.valor)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {property.property_type}
                        </Badge>
                        {property.match_score && (
                          <Badge 
                            variant={property.match_score >= 80 ? "default" : property.match_score >= 60 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {property.match_score}% compatível
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {property.match_reasons && property.match_reasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Motivos da compatibilidade:</p>
                      <div className="flex flex-wrap gap-1">
                        {property.match_reasons.filter(reason => reason).map((reason, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}