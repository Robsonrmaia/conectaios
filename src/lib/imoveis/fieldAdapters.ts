// Valores EXATOS aceitos pelas constraints do banco
export const VISIBILITY_ALLOWED = ['private', 'public_site', 'partners'] as const;
export const STATUS_ALLOWED = ['available', 'reserved', 'sold', 'rented'] as const;
export const PURPOSE_ALLOWED = ['sale', 'rent', 'season'] as const;

type Visibility = typeof VISIBILITY_ALLOWED[number];
type Status = typeof STATUS_ALLOWED[number];
type Purpose = typeof PURPOSE_ALLOWED[number];

// Labels do UI -> valor aceito pelo banco
export const toDbVisibility = (uiValue: string): Visibility => {
  const map: Record<string, Visibility> = {
    'hidden': 'private',
    'private': 'private',
    'public_site': 'public_site',
    'site': 'public_site',
    'both': 'public_site',
    'match_only': 'partners',
    'partners': 'partners',
    'marketplace': 'partners',
  };
  return map[uiValue.toLowerCase()] ?? 'private';
};

// Valor do banco -> label para UI
export const fromDbVisibility = (dbValue: string): string => {
  const map: Record<Visibility, string> = {
    private: 'hidden',
    public_site: 'public_site',
    partners: 'match_only',
  };
  return map[(dbValue as Visibility)] ?? 'hidden';
};

// Status: UI label -> valor do banco
export const toDbStatus = (uiValue: string): Status => {
  const map: Record<string, Status> = {
    'active': 'available',
    'available': 'available',
    'reserved': 'reserved',
    'sold': 'sold',
    'rented': 'rented',
  };
  return map[uiValue.toLowerCase()] ?? 'available';
};

// Valor do banco -> label para UI
export const fromDbStatus = (dbValue: string): string => {
  const map: Record<Status, string> = {
    available: 'available',
    reserved: 'reserved',
    sold: 'sold',
    rented: 'rented',
  };
  return map[(dbValue as Status)] ?? 'available';
};

// Purpose (Finalidade): UI -> DB
export const toDbPurpose = (uiValue: string): Purpose => {
  const map: Record<string, Purpose> = {
    'venda': 'sale',
    'sale': 'sale',
    'aluguel': 'rent',
    'rent': 'rent',
    'locacao': 'rent',
    'temporada': 'season',
    'season': 'season',
  };
  return map[uiValue.toLowerCase()] ?? 'sale';
};

// Purpose: DB -> UI
export const fromDbPurpose = (dbValue: string): string => {
  const map: Record<Purpose, string> = {
    sale: 'venda',
    rent: 'aluguel',
    season: 'temporada',
  };
  return map[(dbValue as Purpose)] ?? 'venda';
};

// Converter valores monetários BR para número
export const toNumber = (value?: string | number | null): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  
  // Remove pontos (milhares) e substitui vírgula por ponto
  const cleaned = String(value)
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

// Regra: calcular is_public baseado em visibility
export const getIsPublic = (visibility: Visibility): boolean => {
  return visibility === 'public_site' || visibility === 'partners';
};
