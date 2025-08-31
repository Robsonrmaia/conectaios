import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Função para permitir entrada de valores com vírgula e ponto
export function parseValueInput(value: string): number {
  // Remove espaços e permite vírgulas como separador decimal
  const cleanValue = value.replace(/[^\d.,]/g, '');
  
  // Se houver vírgula, troca por ponto para parseFloat
  const normalizedValue = cleanValue.replace(',', '.');
  
  return parseFloat(normalizedValue) || 0;
}

// Função para formatar valor de entrada em tempo real
export function formatValueInput(value: string): string {
  const numericValue = parseValueInput(value);
  return numericValue.toLocaleString('pt-BR');
}
