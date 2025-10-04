// Valores EXATOS aceitos pelas constraints do banco
export const VISIBILITY_ALLOWED = ['private', 'public_site', 'partners'] as const;
export const STATUS_ALLOWED = ['available', 'reserved', 'sold', 'rented'] as const;
// IMPORTANTE: Purpose agora usa valores em PORTUGUÊS no banco
export const PURPOSE_ALLOWED = ['venda', 'locacao', 'temporada'] as const;

type Visibility = typeof VISIBILITY_ALLOWED[number];
type Status = typeof STATUS_ALLOWED[number];

// Labels do UI -> valor aceito pelo banco
export const toDbVisibility = (uiValue: string): Visibility => {
  const map: Record<string, Visibility> = {
    'hidden': 'private',
    'private': 'private',
    'public_site': 'public_site',
    'site': 'public_site',
    'both': 'partners',  // "both" = visible em marketplace E site
    'match_only': 'partners',
    'partners': 'partners',
    'marketplace': 'partners',
  };
  return map[uiValue.toLowerCase()] ?? 'private';
};

// Valor do banco -> label para UI
export const fromDbVisibility = (dbValue: string): string => {
  const map: Record<Visibility, string> = {
    private: 'private',
    public_site: 'public_site',
    partners: 'partners',
  };
  return map[(dbValue as Visibility)] ?? 'private';
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
// IMPORTANTE: O banco agora usa valores em PORTUGUÊS
export const toDbPurpose = (uiValue: string): string => {
  const map: Record<string, string> = {
    'venda': 'venda',
    'sale': 'venda',
    'aluguel': 'locacao',
    'rent': 'locacao',
    'locacao': 'locacao',
    'temporada': 'temporada',
    'season': 'temporada',
  };
  return map[uiValue.toLowerCase()] ?? 'venda';
};

// Purpose: DB -> UI (agora retorna o próprio valor pois já está em português)
export const fromDbPurpose = (dbValue: string): string => {
  const map: Record<string, string> = {
    'venda': 'venda',
    'locacao': 'aluguel',
    'temporada': 'temporada',
  };
  return map[dbValue.toLowerCase()] ?? 'venda';
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
