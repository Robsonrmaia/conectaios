/**
 * Configuração de Cidades - Sistema Multi-Cidade ConectaIOS
 * 
 * Este arquivo centraliza as cidades disponíveis na plataforma.
 * Ao adicionar novas cidades, certifique-se de:
 * 1. Adicionar no array CITIES
 * 2. Atualizar a política RLS no banco (validate_city_on_insert)
 */

export interface City {
  value: string;
  label: string;
  state: string;
  region?: string;
}

export const CITIES: City[] = [
  { value: 'Ilhéus', label: 'Ilhéus', state: 'BA', region: 'Costa do Cacau' },
  { value: 'Salvador', label: 'Salvador', state: 'BA', region: 'Região Metropolitana' },
  { value: 'Itabuna', label: 'Itabuna', state: 'BA', region: 'Costa do Cacau' },
  { value: 'Itacaré', label: 'Itacaré', state: 'BA', region: 'Costa do Cacau' },
  { value: 'Canavieiras', label: 'Canavieiras', state: 'BA', region: 'Costa do Cacau' },
  { value: 'Ubaitaba', label: 'Ubaitaba', state: 'BA', region: 'Costa do Cacau' },
  { value: 'Uruçuca', label: 'Uruçuca', state: 'BA', region: 'Costa do Cacau' },
  { value: 'Una', label: 'Una', state: 'BA', region: 'Costa do Cacau' },
];

// Cidade padrão quando usuário não selecionou nenhuma
export const DEFAULT_CITY = 'Ilhéus';

// Helpers
export const getCityLabel = (cityValue: string): string => {
  const city = CITIES.find(c => c.value === cityValue);
  return city?.label || cityValue;
};

export const getCityByValue = (value: string): City | undefined => {
  return CITIES.find(c => c.value === value);
};

export const isValidCity = (city: string): boolean => {
  return CITIES.some(c => c.value === city);
};

// Storage keys
export const STORAGE_KEYS = {
  LAST_SELECTED_CITY: 'conectaios_last_selected_city',
} as const;
