import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, ExternalLink, MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Property {
  id: string;
  title: string;
  price: number;
  city?: string;
  neighborhood?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_built?: number;
}

interface MinisitePreviewProps {
  config: any;
  broker: any;
  properties?: any[];
  preview?: 'mobile' | 'tablet' | 'desktop';
}

export default function MinisitePreview({ config, broker, properties = [], preview = 'desktop' }: MinisitePreviewProps) {
  const [mockProperties, setMockProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock data until proper minisite integration
    const mockData: Property[] = [
      {
        id: '1',
        title: 'Apartamento Moderno no Centro',
        price: 450000,
        city: 'São Paulo',
        neighborhood: 'Centro',
        type: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        area_built: 85
      },
      {
        id: '2',
        title: 'Casa com Quintal em Bairro Residencial',
        price: 650000,
        city: 'São Paulo',
        neighborhood: 'Vila Madalena',
        type: 'house',
        bedrooms: 3,
        bathrooms: 2,
        area_built: 120
      }
    ];
    
    setMockProperties(mockData);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Minisite Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview do Minisite
              </CardTitle>
              <CardDescription>
                Visualização de como seu minisite aparece para os visitantes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Minisite
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Properties Section */}
      <Card>
        <CardHeader>
          <CardTitle>Imóveis em Destaque</CardTitle>
          <CardDescription>
            Propriedades disponíveis neste corretor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Carregando imóveis...</div>
            </div>
          ) : mockProperties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum imóvel encontrado</p>
              <p className="text-sm">Adicione imóveis ao seu portfólio para exibi-los aqui</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {property.city && property.neighborhood && (
                          <span>{property.neighborhood}, {property.city}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(property.price)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {property.type === 'apartment' ? 'Apartamento' : 'Casa'}
                        </Badge>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {property.bedrooms && (
                          <span>{property.bedrooms} quartos</span>
                        )}
                        {property.bathrooms && (
                          <span>• {property.bathrooms} banheiros</span>
                        )}
                        {property.area_built && (
                          <span>• {property.area_built}m²</span>
                        )}
                      </div>
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