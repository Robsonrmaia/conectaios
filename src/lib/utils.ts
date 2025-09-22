import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const formatCurrency = (amount: number | string | null | undefined): string => {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return numValue.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatNumber = (num: number | string | null | undefined): string => {
  const numValue = typeof num === 'string' ? parseFloat(num) : (num || 0);
  return numValue.toLocaleString('pt-BR');
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cache para evitar reprocessamento de valores
const parseValueCache = new Map<string, number>();

// Função otimizada para permitir entrada de valores com vírgula e ponto
export function parseValueInput(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Verificar cache primeiro
  if (parseValueCache.has(value)) {
    return parseValueCache.get(value)!;
  }
  
  // Remove espaços em branco e símbolos de moeda
  let cleanValue = value.trim().replace(/[R$\s]/g, '');
  
  // Se tem pontos como separadores de milhares e vírgula como decimal (formato brasileiro)
  // Ex: 500.000,00 -> pontos são separadores, vírgula é decimal
  if (cleanValue.includes('.') && cleanValue.includes(',')) {
    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Vírgula vem depois do ponto: formato brasileiro 1.000.000,50
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Ponto vem depois da vírgula: formato americano 1,000,000.50
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (cleanValue.includes('.')) {
    // Só tem pontos - verificar se é separador de milhares ou decimal
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      // Múltiplos pontos: formato brasileiro como separador de milhares (500.000.000)
      cleanValue = cleanValue.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length > 2) {
      // Um ponto com mais de 2 dígitos depois: separador de milhares (500.000)
      cleanValue = cleanValue.replace(/\./g, '');
    }
    // Senão mantém como está (formato decimal americano 500.50)
  } else if (cleanValue.includes(',')) {
    // Só vírgula - decimal brasileiro
    cleanValue = cleanValue.replace(',', '.');
  }
  
  // Remove caracteres não numéricos exceto ponto final
  cleanValue = cleanValue.replace(/[^\d.]/g, '');
  
  const result = parseFloat(cleanValue) || 0;
  
  // Armazenar no cache
  parseValueCache.set(value, result);
  
  return result;
}

// Função inteligente para parsing de valores monetários em português
export function parseMonetaryValue(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  const cleanValue = value.trim().toLowerCase();
  
  // Detectar valores escritos por extenso
  let multiplier = 1;
  let numericPart = cleanValue;
  
  if (cleanValue.includes('milhão') || cleanValue.includes('milhões')) {
    multiplier = 1000000;
    numericPart = cleanValue.replace(/milhões?/g, '').trim();
  } else if (cleanValue.includes('mil')) {
    multiplier = 1000;
    numericPart = cleanValue.replace(/mil/g, '').trim();
  }
  
  // Extrair números do texto
  const numberMatch = numericPart.match(/\d+([.,]\d+)?/);
  if (!numberMatch) return 0;
  
  const baseValue = parseValueInput(numberMatch[0]);
  return baseValue * multiplier;
}

// Função para formatar valor de entrada em tempo real
export function formatValueInput(value: string): string {
  const numericValue = parseValueInput(value);
  return numericValue.toLocaleString('pt-BR');
}
