import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Eye, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { ClientSearches, Properties } from "@/data";
import type { Imovel } from "@/data";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ClientSearch {
  id: string;
  name: string;
  filters: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function MinhasBuscas() {
  const [searches, setSearches] = useState<ClientSearch[]>([]);
  const [matches, setMatches] = useState<Imovel[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<ClientSearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState("");
  const [newSearchFilters, setNewSearchFilters] = useState({
    query: "",
    city: "",
    purpose: "",
    min_price: "",
    max_price: ""
  });
  const { user } = useAuth();

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    try {
      const data = await ClientSearches.list(user?.id);
      setSearches(data);
    } catch (error) {
      console.error("Error loading searches:", error);
      toast.error("Erro ao carregar buscas salvas");
    }
  };

  const createSearch = async () => {
    if (!newSearchName.trim()) {
      toast.error("Nome da busca é obrigatório");
      return;
    }

    try {
      await ClientSearches.create({
        name: newSearchName,
        filters: newSearchFilters,
        broker_id: user?.id
      });

      setNewSearchName("");
      setNewSearchFilters({
        query: "",
        city: "",
        purpose: "",
        min_price: "",
        max_price: ""
      });
      setShowCreateDialog(false);
      loadSearches();
      toast.success("Busca salva com sucesso!");
    } catch (error) {
      console.error("Error creating search:", error);
      toast.error("Erro ao salvar busca");
    }
  };

  const runSearch = async (search: ClientSearch) => {
    try {
      setLoading(true);
      setSelectedSearch(search);

      const filters = search.filters;
      const matchData = await Properties.findIntelligentMatches(
        filters.query || "",
        filters.city || null
      );

      setMatches(matchData);
      
      // Update match count
      await ClientSearches.update(search.id, {
        ...search,
        updated_at: new Date().toISOString()
      });

      toast.success(`${matchData.length} imóveis encontrados`);
    } catch (error) {
      console.error("Error running search:", error);
      toast.error("Erro ao executar busca");
    } finally {
      setLoading(false);
    }
  };

  const toggleSearch = async (search: ClientSearch) => {
    try {
      await ClientSearches.update(search.id, {
        ...search,
        is_active: !search.is_active
      });
      loadSearches();
      toast.success(
        search.is_active ? "Busca desativada" : "Busca ativada"
      );
    } catch (error) {
      console.error("Error toggling search:", error);
      toast.error("Erro ao alterar status da busca");
    }
  };

  const deleteSearch = async (search: ClientSearch) => {
    try {
      await ClientSearches.delete(search.id);
      loadSearches();
      toast.success("Busca excluída com sucesso");
    } catch (error) {
      console.error("Error deleting search:", error);
      toast.error("Erro ao excluir busca");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Buscas</h1>
          <p className="text-muted-foreground">
            Gerencie suas buscas salvas e monitore automaticamente o mercado
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Busca
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Busca</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome da busca"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
              />
              
              <Input
                placeholder="Palavras-chave"
                value={newSearchFilters.query}
                onChange={(e) =>
                  setNewSearchFilters(prev => ({ ...prev, query: e.target.value }))
                }
              />

              <Select
                value={newSearchFilters.city}
                onValueChange={(value) =>
                  setNewSearchFilters(prev => ({ ...prev, city: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="São Paulo">São Paulo</SelectItem>
                  <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                  <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={newSearchFilters.purpose}
                onValueChange={(value) =>
                  setNewSearchFilters(prev => ({ ...prev, purpose: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Finalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="rent">Aluguel</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Preço mínimo"
                  type="number"
                  value={newSearchFilters.min_price}
                  onChange={(e) =>
                    setNewSearchFilters(prev => ({ ...prev, min_price: e.target.value }))
                  }
                />
                <Input
                  placeholder="Preço máximo"
                  type="number"
                  value={newSearchFilters.max_price}
                  onChange={(e) =>
                    setNewSearchFilters(prev => ({ ...prev, max_price: e.target.value }))
                  }
                />
              </div>

              <Button onClick={createSearch} className="w-full">
                Salvar Busca
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Searches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searches.map((search) => (
          <Card key={search.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{search.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={search.is_active ? "default" : "secondary"}>
                    {search.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Palavras-chave:</strong> {search.filters.query || "Nenhuma"}</p>
                  <p><strong>Cidade:</strong> {search.filters.city || "Todas"}</p>
                  <p><strong>Finalidade:</strong> {search.filters.purpose === 'sale' ? 'Venda' : search.filters.purpose === 'rent' ? 'Aluguel' : 'Todas'}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => runSearch(search)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Executar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSearch(search)}
                  >
                    {search.is_active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSearch(search)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {searches.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma busca salva</h3>
            <p className="text-muted-foreground mb-4">
              Crie buscas personalizadas para monitorar o mercado automaticamente
            </p>
          </CardContent>
        </Card>
      )}

      {/* Matches Results */}
      {selectedSearch && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados para "{selectedSearch.name}"</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum imóvel encontrado para esta busca
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((property) => (
                  <Card key={property.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <h3 className="font-semibold line-clamp-2">{property.title}</h3>
                        
                        {property.price && (
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(Number(property.price))}
                          </p>
                        )}

                        <div className="text-sm text-muted-foreground">
                          {[property.neighborhood, property.city]
                            .filter(Boolean)
                            .join(", ")}
                        </div>

                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}