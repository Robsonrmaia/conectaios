import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Bath, Bed, Car, Eye, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PropertyIcons } from '@/components/PropertyIcons';
import { Card } from '@/components/ui/card';
import type { PropertyVideo } from '@/components/property-presentation/types';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  fotos: string[];
  listing_type: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  verified?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
  has_sea_view?: boolean;
  finalidade: string;
  descricao: string;
  videos?: PropertyVideo[];
  user_id: string;
  owner_id: string;
  created_at: string;
  property_type?: string;
  condominium_fee?: number;
  iptu?: number;
  reference_code?: string;
  banner_type?: string | null;
  status?: string;
  brokers?: {
    id: string;
    name: string;
    avatar_url?: string;
    creci?: string;
    bio?: string;
    status?: string;
  } | null;
  conectaios_brokers?: {
    id: string;
    name: string;
    avatar_url?: string;
    creci?: string;
    bio?: string;
  } | null;
  profiles?: {
    nome: string;
  } | null;
}

interface PropertyListViewProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

export function PropertyListView({ property, onViewDetails }: PropertyListViewProps) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onViewDetails(property)}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          <img 
            src={property.fotos?.[0] || '/placeholder.svg'} 
            alt={property.titulo}
            className="w-32 h-24 object-cover rounded"
          />
          {property.verified && (
            <div className="absolute top-1 right-1">
              <Badge variant="default" className="text-[10px] bg-green-500 text-white border-0 px-1 py-0">
                ✓
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Title and Price */}
          <div>
            <div className="flex justify-between items-start gap-4 mb-2">
              <h3 className="font-semibold text-base truncate flex-1">{property.titulo}</h3>
              <span className="font-bold text-primary whitespace-nowrap text-lg">
                {formatCurrency(property.valor)}
              </span>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{property.area}m²</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                <span>{property.quartos}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                <span>{property.bathrooms || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                <span>{property.parking_spots || 0}</span>
              </div>
              <PropertyIcons 
                furnishing_type={property.furnishing_type as 'none' | 'furnished' | 'semi_furnished'}
                sea_distance={property.sea_distance}
                has_sea_view={property.has_sea_view}
                className=""
              />
            </div>

            {/* Location */}
            {(property.neighborhood || property.city) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {property.neighborhood && property.city 
                    ? `${property.neighborhood}, ${property.city}`
                    : property.neighborhood || property.city}
                </span>
              </div>
            )}
          </div>

          {/* Bottom row: Listing type, broker, and action button */}
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {property.listing_type === 'sale' || property.listing_type === 'venda' ? 'Venda' : 
                 property.listing_type === 'rent' || property.listing_type === 'locacao' || property.listing_type === 'aluguel' ? 'Aluguel' : 
                 property.listing_type === 'season' || property.listing_type === 'temporada' ? 'Temporada' : 'Venda'}
              </Badge>
              {property.brokers?.avatar_url ? (
                <img 
                  src={property.brokers.avatar_url} 
                  alt={property.brokers.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                  {property.brokers?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '👤'}
                </div>
              )}
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {property.brokers?.name || property.profiles?.nome || 'Não informado'}
              </span>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(property);
              }}
              className="flex-shrink-0"
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
