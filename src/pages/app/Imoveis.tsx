import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PropertyForm from '@/components/PropertyForm';

export default function Imoveis() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('imoveis')
        .select(`
          id,
          title,
          description,
          price,
          city,
          neighborhood,
          bedrooms,
          bathrooms,
          owner_id,
          created_at,
          updated_at,
          type,
          purpose,
          status
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imóveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Imóveis</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Imóvel
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <p className="text-muted-foreground">Nenhum imóvel encontrado</p>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Imóvel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-2 text-base">
                    {property.title || 'Sem título'}
                  </CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {property.description || 'Sem descrição'}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-primary">
                      R$ {(property.price || 0).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {property.type === 'apartment' ? 'Apartamento' :
                       property.type === 'house' ? 'Casa' :
                       property.type === 'commercial' ? 'Comercial' :
                       property.type === 'land' ? 'Terreno' : 
                       property.type || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    📍 {property.city} - {property.neighborhood}
                  </div>
                  
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {property.bedrooms > 0 && (
                      <span>🛏️ {property.bedrooms} quartos</span>
                    )}
                    {property.bathrooms > 0 && (
                      <span>🚿 {property.bathrooms} banheiros</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {property.purpose === 'sale' ? 'Venda' :
                       property.purpose === 'rent' ? 'Aluguel' :
                       property.purpose === 'both' ? 'Venda/Aluguel' : 'N/A'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      property.status === 'available' ? 'bg-green-100 text-green-700' :
                      property.status === 'sold' ? 'bg-red-100 text-red-700' :
                      property.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {property.status === 'available' ? 'Disponível' :
                       property.status === 'sold' ? 'Vendido' :
                       property.status === 'rented' ? 'Alugado' :
                       property.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PropertyForm 
        open={showForm} 
        onOpenChange={setShowForm}
        onSuccess={() => {
          fetchProperties();
          toast({
            title: "Sucesso",
            description: "Imóvel adicionado com sucesso!",
          });
        }}
      />
    </div>
  );
}