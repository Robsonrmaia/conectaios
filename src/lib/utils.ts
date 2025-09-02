import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
}

// Função para permitir entrada de valores com vírgula e ponto
export function parseValueInput(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove espaços em branco
  let cleanValue = value.trim();
  
  // Se tem pontos como separadores de milhares e vírgula como decimal (formato brasileiro)
  // Ex: 500.000,00 -> pontos são separadores, vírgula é decimal
  if (cleanValue.includes('.') && cleanValue.includes(',')) {
    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Vírgula vem depois do ponto: formato 1.000,50
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Ponto vem depois da vírgula: formato 1,000.50
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (cleanValue.includes('.')) {
    // Só tem pontos - pode ser separador de milhares ou decimal
    const dotCount = (cleanValue.match(/\./g) || []).length;
    if (dotCount === 1 && cleanValue.split('.')[1].length <= 2) {
      // Provavelmente é decimal: 500.50
      // Mantém como está
    } else {
      // Provavelmente separadores de milhares: 500.000
      cleanValue = cleanValue.replace(/\./g, '');
    }
  } else if (cleanValue.includes(',')) {
    // Só vírgula - provavelmente decimal brasileiro
    cleanValue = cleanValue.replace(',', '.');
  }
  
  // Remove caracteres não numéricos exceto ponto final
  cleanValue = cleanValue.replace(/[^\d.]/g, '');
  
  return parseFloat(cleanValue) || 0;
}

// Função para formatar valor de entrada em tempo real
export function formatValueInput(value: string): string {
  const numericValue = parseValueInput(value);
  return numericValue.toLocaleString('pt-BR');
}
