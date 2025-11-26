import { Badge } from '@/components/ui/badge';
import { Bath, Bed } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
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
  verified?: boolean;
  listing_type: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
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

interface PropertyIconViewProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

export function PropertyIconView({ property, onViewDetails }: PropertyIconViewProps) {
  return (
    <div 
      className="border rounded-lg p-2 hover:shadow-md cursor-pointer transition-shadow bg-card relative group"
      onClick={() => onViewDetails(property)}
    >
      {/* Verified Badge */}
      {property.verified && (
        <div className="absolute top-1 right-1 z-10">
          <Badge variant="default" className="text-[8px] bg-green-500 text-white border-0 px-1 py-0 h-4">
            ✓
          </Badge>
        </div>
      )}

      {/* Square Photo */}
      <div className="relative">
        <img 
          src={property.fotos?.[0] || '/placeholder.svg'} 
          alt={property.titulo}
          className="w-full aspect-square object-cover rounded mb-1"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
      </div>
      
      {/* Price */}
      <div className="text-xs font-bold text-center truncate text-primary mb-1">
        {formatCurrency(property.valor)}
      </div>
      
      {/* Ultra Compact Icons */}
      <div className="flex justify-center gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-0.5">
          <Bed className="h-2.5 w-2.5" />
          <span>{property.quartos}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Bath className="h-2.5 w-2.5" />
          <span>{property.bathrooms || 0}</span>
        </div>
      </div>
    </div>
  );
}
