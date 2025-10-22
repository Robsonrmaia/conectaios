export interface PropertyVideo {
  type: 'url' | 'upload';
  url: string;
  title?: string;
  thumbnail?: string;
  filename?: string;
  size?: number;
}

export interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  fotos: string[];
  videos?: PropertyVideo[];
  sketch_url?: string | null;
  user_id?: string;
  listing_type?: string;
  property_type?: string;
  neighborhood?: string;
  city?: string;
  zipcode?: string;
  descricao?: string;
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number;
  condominium_fee?: number;
  iptu?: number;
  year_built?: number;
  tour_360_url?: string;
  state?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface BrokerDisplay {
  name?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  username?: string;
  minisite_slug?: string;
}