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
  }).format(value || 0);
}

// Função para permitir entrada de valores com vírgula e ponto
export function parseValueInput(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove espaços em branco e símbolos de moeda
  let cleanValue = value.trim().replace(/[R$\s]/g, '');
  
  console.log('Parsing value:', value, 'cleaned:', cleanValue);
  
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
  console.log('Final parsed value:', result);
  return result;
}

// Função para formatar valor de entrada em tempo real
export function formatValueInput(value: string): string {
  const numericValue = parseValueInput(value);
  return numericValue.toLocaleString('pt-BR');
}
