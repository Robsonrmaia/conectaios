import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Search, MessageCircle } from "lucide-react";
import { Properties, CRM } from "@/data";
import type { Imovel, CRMClient } from "@/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Match() {
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [matches, setMatches] = useState<Imovel[]>([]);
  const [selectedClient, setSelectedClient] = useState<CRMClient | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await CRM.clients.list();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Erro ao carregar clientes");
    }
  };

  const findMatches = async (client: CRMClient) => {
    if (!client || !user) return;

    try {
      setLoading(true);
      setSelectedClient(client);

      // Build filters from client preferences
      const filters = {
        city: client.preferred_locations?.[0] || null,
        min_price: client.budget_min || null,
        max_price: client.budget_max || null
      };

      const matchData = await Properties.findMatches(user.id, filters);
      setMatches(matchData);
      toast.success(`Encontrados ${matchData.length} imóveis compatíveis`);
    } catch (error) {
      console.error("Error finding matches:", error);
      toast.error("Erro ao buscar matches");
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async (propertyId: string) => {
    if (!selectedClient) return;

    try {
      await CRM.deals.create({
        client_id: selectedClient.id,
        property_id: propertyId,
        status: 'negotiating',
        offer_amount: 0,
        commission_amount: 0,
        user_id: user.id,
        notes: `Match gerado automaticamente para ${selectedClient.name}`
      });
      toast.success("Deal criado com sucesso!");
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Erro ao criar deal");
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500" />
          Sistema de Matches
        </h1>
        <p className="text-muted-foreground">
          Encontre imóveis perfeitos para seus clientes
        </p>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card
            key={client.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              selectedClient?.id === client.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => findMatches(client)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{client.name}</span>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  Cliente
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {client.email && (
                  <p className="text-muted-foreground">{client.email}</p>
                )}
                {client.phone && (
                  <p className="text-muted-foreground">{client.phone}</p>
                )}
                {(client.budget_min || client.budget_max) && (
                  <p className="font-medium">
                    Orçamento: {client.budget_min ? formatPrice(Number(client.budget_min)) : "R$ 0"} - {client.budget_max ? formatPrice(Number(client.budget_max)) : "Sem limite"}
                  </p>
                )}
                {client.preferred_locations && client.preferred_locations.length > 0 && (
                  <p className="text-muted-foreground">
                    Localização: {client.preferred_locations.join(", ")}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                disabled={loading}
              >
                <Search className="h-4 w-4 mr-2" />
                {loading && selectedClient?.id === client.id ? "Buscando..." : "Buscar Matches"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
            <p className="text-muted-foreground">
              Cadastre clientes no CRM para começar a fazer matches
            </p>
          </CardContent>
        </Card>
      )}

      {/* Matches Results */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Matches para {selectedClient.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum imóvel encontrado para este cliente
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((property) => (
                  <Card key={property.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <h3 className="font-semibold">{property.title}</h3>
                        
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

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => createDeal(property.id)}
                            className="flex-1"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Criar Deal
                          </Button>
                        </div>
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