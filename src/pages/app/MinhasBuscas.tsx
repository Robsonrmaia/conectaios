import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Trash2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBroker } from "@/hooks/useBroker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { asClientSearchArray } from "@/utils/typeCompat";

interface ClientSearch {
  id: string;
  name: string;
  title: string;
  filters: any;
  broker_id: string;
  client_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property_type: string;
  listing_type: string;
  max_price: number;
  match_count: number;
}

export default function MinhasBuscas() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [searches, setSearches] = useState<ClientSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [newSearchDescription, setNewSearchDescription] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    if (broker?.id) {
      loadSavedSearches();
    }
  }, [broker]);

  const loadSavedSearches = async () => {
    try {
      setLoading(true);
      const { data: searchData, error } = await supabase
        .from('client_searches')
        .select('*')
        .eq('broker_id', broker.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar buscas:', error);
        toast.error('Erro ao carregar buscas salvas');
        return;
      }

      setSearches(asClientSearchArray(searchData || []));
    } catch (error) {
      console.error('Erro ao carregar buscas:', error);
      toast.error('Erro ao carregar buscas salvas');
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (search: ClientSearch) => {
    try {
      const filters = search.filters || {};
      
      const { data: results, error } = await supabase.rpc('find_property_matches', {
        p_broker_id: broker.id,
        p_filters: filters,
        p_limit: 50,
        p_offset: 0
      });

      if (error) {
        console.error('Erro na busca:', error);
        toast.error('Erro ao executar busca');
        return;
      }

      toast.success(`Encontrados ${results?.length || 0} imóveis`);
      
      // Update search with results count (compatibility handled by typeCompat)
      await supabase
        .from('client_searches')
        .update({ 
          name: search.name,
          filters: search.filters,
          updated_at: new Date().toISOString()
        })
        .eq('id', search.id);

      await loadSavedSearches();
    } catch (error) {
      console.error('Erro ao executar busca:', error);
      toast.error('Erro ao executar busca');
    }
  };

  const createSearch = async () => {
    if (!newSearchName.trim()) {
      toast.error('Nome da busca é obrigatório');
      return;
    }

    try {
      const filters = {
        city: selectedCity || null,
        purpose: selectedPurpose || null,
        min_price: minPrice ? parseFloat(minPrice) : null,
        max_price: maxPrice ? parseFloat(maxPrice) : null
      };

      const { error } = await supabase
        .from('client_searches')
        .insert({
          broker_id: broker.id,
          name: newSearchName,
          filters,
          is_active: true
        });

      if (error) {
        console.error('Erro ao criar busca:', error);
        toast.error('Erro ao criar busca');
        return;
      }

      toast.success('Busca salva com sucesso!');
      setShowCreateDialog(false);
      resetForm();
      await loadSavedSearches();
    } catch (error) {
      console.error('Erro ao criar busca:', error);
      toast.error('Erro ao criar busca');
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('client_searches')
        .delete()
        .eq('id', searchId);

      if (error) {
        console.error('Erro ao excluir busca:', error);
        toast.error('Erro ao excluir busca');
        return;
      }

      toast.success('Busca excluída com sucesso!');
      await loadSavedSearches();
    } catch (error) {
      console.error('Erro ao excluir busca:', error);
      toast.error('Erro ao excluir busca');
    }
  };

  const resetForm = () => {
    setNewSearchName("");
    setNewSearchDescription("");
    setSelectedCity("");
    setSelectedPurpose("");
    setMinPrice("");
    setMaxPrice("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando buscas salvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Buscas</h1>
          <p className="text-muted-foreground">
            Gerencie suas buscas salvas e monitore o mercado
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Busca
        </Button>
      </div>

      {searches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma busca salva</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie sua primeira busca para monitorar imóveis automaticamente
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Busca
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {searches.map((search) => (
            <Card key={search.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{search.title || search.name}</CardTitle>
                    <Badge variant={search.is_active ? "default" : "secondary"}>
                      {search.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {search.filters?.city && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {search.filters.city}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      {search.match_count || 0} resultados
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => executeSearch(search)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteSearch(search.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Busca Salva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-name">Nome da Busca</Label>
              <Input
                id="search-name"
                placeholder="Ex: Apartamentos Centro"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Digite a cidade"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="purpose">Finalidade</Label>
              <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a finalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="rent">Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-price">Preço Mín.</Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="R$ 0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="max-price">Preço Máx.</Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="R$ 999.999"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createSearch}>
                Salvar Busca
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}