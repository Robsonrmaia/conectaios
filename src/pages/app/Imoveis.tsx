import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Imoveis() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          titulo,
          description,
          descricao,
          price,
          valor,
          city,
          cidade,
          neighborhood,
          bairro,
          bedrooms,
          bathrooms,
          owner_id,
          created_at,
          updated_at,
          thumb_url
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
        <Button onClick={() => {
          toast({
            title: "Em desenvolvimento",
            description: "Funcionalidade em desenvolvimento",
          });
        }}>
          Adicionar Imóvel
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum imóvel encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">
                  {property.titulo || property.title || 'Sem título'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {property.descricao || property.description || 'Sem descrição'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">
                      R$ {((property.valor || property.price) || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {property.cidade || property.city} - {property.bairro || property.neighborhood}
                  </div>
                  <div className="flex gap-2 text-sm">
                    {property.bedrooms && (
                      <span>{property.bedrooms} quartos</span>
                    )}
                    {property.bathrooms && (
                      <span>{property.bathrooms} banheiros</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}