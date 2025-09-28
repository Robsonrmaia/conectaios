import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Share2, ExternalLink, MapPin, BedDouble, Bath, Car } from 'lucide-react';
import { toast } from 'sonner';

interface MinisitePreviewProps {
  broker: any;
  config: any;
}

export default function MinisitePreview({ broker, config }: MinisitePreviewProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, [broker?.user_id]);

  const fetchProperties = async () => {
    if (!broker?.user_id) {
      console.log('🏠 No broker user_id available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch public properties for the minisite
      const { data: publicProperties } = await supabase
        .from('imoveis')
        .select('*')
        .eq('owner_id', broker.user_id)
        .eq('visibility', 'public_site')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (publicProperties) {
        setProperties(publicProperties);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Erro ao carregar imóveis do minisite');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando preview do minisite...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview do Minisite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-lg"
            style={{ 
              backgroundColor: config?.primary_color || '#3B82F6',
              color: 'white'
            }}
          >
            <h1 className="text-2xl font-bold mb-2">{config?.title || 'Meu Minisite'}</h1>
            <p className="text-lg opacity-90">{broker?.name || 'Corretor'}</p>
            {broker?.creci && (
              <p className="text-sm opacity-75">CRECI: {broker.creci}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Imóveis em Destaque ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum imóvel público encontrado para o minisite.
              </p>
              <p className="text-sm text-muted-foreground">
                Para exibir imóveis no minisite, publique alguns imóveis com visibilidade "Site Público".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    {/* Placeholder for property image */}
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <MapPin className="h-8 w-8" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{property.city}</span>
                    </div>
                    {property.price && (
                      <p className="text-xl font-bold text-primary mb-3">
                        R$ {property.price.toLocaleString('pt-BR')}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-4 w-4" />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      {property.parking && (
                        <div className="flex items-center gap-1">
                          <Car className="h-4 w-4" />
                          <span>{property.parking}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}