import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Search, Filter, MapPin, Bath, Bed, Car } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Imoveis() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for properties
  const properties = [
    {
      id: 1,
      title: 'Apartamento Luxo Jardins',
      price: 850000,
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
      parking: 2,
      location: 'Jardins, São Paulo',
      type: 'Apartamento',
      status: 'Disponível',
      image: '/placeholder.svg'
    },
    {
      id: 2,
      title: 'Casa Condomínio Alphaville',
      price: 1200000,
      area: 280,
      bedrooms: 4,
      bathrooms: 3,
      parking: 4,
      location: 'Alphaville, Barueri',
      type: 'Casa',
      status: 'Reservado',
      image: '/placeholder.svg'
    },
    {
      id: 3,
      title: 'Cobertura Vista Mar',
      price: 2500000,
      area: 200,
      bedrooms: 4,
      bathrooms: 4,
      parking: 3,
      location: 'Barra da Tijuca, Rio de Janeiro',
      type: 'Cobertura',
      status: 'Vendido',
      image: '/placeholder.svg'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'bg-success/20 text-success';
      case 'Reservado': return 'bg-warning/20 text-warning';
      case 'Vendido': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            Imóveis
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu portfólio de imóveis
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Imóvel
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted relative">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <Badge className={`absolute top-3 right-3 ${getStatusColor(property.status)}`}>
                {property.status}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{property.title}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {property.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">
                R$ {property.price.toLocaleString('pt-BR')}
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {property.area}m²
                </div>
                <div className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {property.bedrooms}
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  {property.bathrooms}
                </div>
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {property.parking}
                </div>
              </div>

              <Badge variant="secondary">
                {property.type}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}