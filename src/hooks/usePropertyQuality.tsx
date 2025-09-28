import { useState } from 'react';

interface QualityAnalysis {
  score: number;
  suggestions: string[];
  missingCriteria: string[];
}

interface Property {
  id: string;
  titulo?: string;
  valor?: number;
  descricao?: string;
  area?: number;
  quartos?: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  coordinates?: any;
  fotos?: string[];
}

export function usePropertyQuality() {
  const [loading, setLoading] = useState(false);

  const calculateQualityAnalysis = (property: Property): QualityAnalysis => {
    const suggestions: string[] = [];
    const missingCriteria: string[] = [];
    let score = 0;

    // Check valor (15 points)
    if (property.valor && property.valor > 0) {
      score += 15;
    } else {
      suggestions.push("💰 Defina o valor do imóvel para ganhar +15 pontos!");
      missingCriteria.push("valor");
    }

    // Check description (20 points)
    const descLength = property.descricao?.length || 0;
    if (descLength >= 600) {
      score += 20;
    } else if (descLength >= 300) {
      score += 10;
      suggestions.push(`📝 Sua descrição tem ${descLength} caracteres. Adicione mais ${600 - descLength} para ganhar +10 pontos!`);
      missingCriteria.push("descricao_completa");
    } else {
      suggestions.push(`📝 Sua descrição tem ${descLength} caracteres. Adicione mais ${600 - descLength} para ganhar +20 pontos!`);
      missingCriteria.push("descricao");
    }

    // Check area (10 points)
    if (property.area && property.area > 0) {
      score += 10;
    } else {
      suggestions.push("📐 Informe a área do imóvel para ganhar +10 pontos!");
      missingCriteria.push("area");
    }

    // Check quartos (10 points)
    if (property.quartos && property.quartos >= 1) {
      score += 10;
    } else {
      suggestions.push("🏠 Informe a quantidade de quartos para ganhar +10 pontos!");
      missingCriteria.push("quartos");
    }

    // Check address (10 points)
    if (property.address && property.address.length > 10) {
      score += 10;
    } else {
      suggestions.push("📍 Complete o endereço para ganhar +10 pontos!");
      missingCriteria.push("endereco");
    }

    // Check neighborhood (5 points)
    if (property.neighborhood) {
      score += 5;
    } else {
      suggestions.push("🏘️ Adicione o bairro para ganhar +5 pontos!");
      missingCriteria.push("bairro");
    }

    // Check city (5 points)
    if (property.city) {
      score += 5;
    } else {
      suggestions.push("🌆 Adicione a cidade para ganhar +5 pontos!");
      missingCriteria.push("cidade");
    }

    // Check coordinates (5 points)
    if (property.coordinates) {
      score += 5;
    } else {
      suggestions.push("🗺️ Adicione as coordenadas GPS para ganhar +5 pontos!");
      missingCriteria.push("coordenadas");
    }

    // Check photos (20 points max)
    const photoCount = property.fotos?.length || 0;
    if (photoCount >= 8) {
      score += 20;
    } else if (photoCount >= 5) {
      score += 10;
      suggestions.push(`🖼️ Você tem ${photoCount} fotos. Adicione mais ${8 - photoCount} para ganhar +10 pontos!`);
      missingCriteria.push("fotos_extras");
    } else if (photoCount >= 3) {
      score += 5;
      suggestions.push(`🖼️ Você tem ${photoCount} fotos. Adicione mais ${8 - photoCount} para ganhar +15 pontos!`);
      missingCriteria.push("fotos");
    } else {
      suggestions.push(`🖼️ Adicione ${Math.max(8 - photoCount, 8)} fotos para ganhar +20 pontos!`);
      missingCriteria.push("fotos");
    }

    return {
      score,
      suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
      missingCriteria
    };
  };

  const fetchDatabaseQuality = async (propertyId: string): Promise<number> => {
    setLoading(true);
    try {
      // Since calc_imovel_quality function doesn't exist in current schema,
      // return a mock quality score for now
      console.warn('Property quality calculation not available');
      return 75; // Default quality score
    } catch (error) {
      console.error('Error fetching quality:', error);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  return {
    calculateQualityAnalysis,
    fetchDatabaseQuality,
    loading
  };
}