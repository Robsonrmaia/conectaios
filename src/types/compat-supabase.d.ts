// Compatibility shims for Supabase types to prevent build errors
// without modifying the core application components

declare type AnyRecord = Record<string, any>;

declare namespace Compat {
  // Light shim for Database type compatibility
  type Database = AnyRecord;
  
  // Common properties to prevent type errors
  interface BaseRow {
    id: string;
    created_at: string;
    updated_at?: string;
    [key: string]: any;
  }
  
  // Property compatibility interface  
  interface PropertyCompat extends BaseRow {
    titulo?: string;
    valor?: number;
    descricao?: string;
    area?: number;
    quartos?: number;
    bathrooms?: number;
    parking_spots?: number;
    fotos?: string[];
    videos?: string[];
    neighborhood?: string;
    city?: string;
    zipcode?: string;
    condominium_fee?: number;
    iptu?: number;
    listing_type?: string;
    property_type?: string;
    visibility?: string;
    banner_type?: string;
    furnishing_type?: string;
    sea_distance?: number;
    has_sea_view?: boolean;
    raw_cnm?: any;
    raw_vrsync?: any;
    distancia_mar?: number;
  }
  
  // User compatibility interface
  interface UserCompat extends BaseRow {
    user_id?: string;
    email?: string;
    name?: string;
    nome?: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    cover_url?: string;
    phone?: string;
    role?: string;
  }
  
  // Broker compatibility interface
  interface BrokerCompat extends BaseRow {
    user_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    creci?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
    cover_url?: string;
    status?: string;
    subscription_status?: string;
  }

  // Indication compatibility types
  interface CompatIndication extends BaseRow {
    referrer_id?: string;
    referred_id?: string; 
    referred_email?: string;
    status?: string;
    reward_amount?: number;
    [key: string]: any;
  }
}

// Global type shims for compatibility
declare global {
  type CompatIndication = Compat.CompatIndication;
  var compatIndication: CompatIndication;
}