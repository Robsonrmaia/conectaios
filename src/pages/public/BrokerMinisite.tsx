import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BrokerMinisite() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [broker, setBroker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    if (username) {
      fetchBroker();
    }
  }, [username]);

  const fetchBroker = async () => {
    try {
      // Buscar broker por nome (username não existe na tabela)
      const { data: brokerData, error } = await supabase
        .from('conectaios_brokers')
        .select('*')
        .ilike('name', `%${username}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!brokerData) {
        navigate('/404');
        return;
      }

      setBroker(brokerData);
      await fetchProperties(brokerData.user_id);
    } catch (error) {
      console.error('Error fetching broker:', error);
      navigate('/404');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async (ownerId: string) => {
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_public', true)
        .limit(6);

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Corretor não encontrado</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{broker.name}</h1>
          <p className="text-xl mb-2">{broker.bio || 'Corretor de imóveis'}</p>
          <p className="mb-4">CRECI: {broker.creci || 'Não informado'}</p>
          
          <div className="flex justify-center gap-4">
            {broker.phone && (
              <Button variant="secondary">
                WhatsApp: {broker.phone}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Imóveis Disponíveis</h2>
        
        {properties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum imóvel disponível no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id}>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">{property.titulo || property.title}</h3>
                  <p className="text-lg font-semibold text-primary mb-2">
                    R$ {(property.valor || property.price || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {property.cidade || property.city} - {property.bairro || property.neighborhood}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}