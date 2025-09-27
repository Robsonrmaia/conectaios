import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PropertyQuality {
  id: string;
  imovel_id: string;
  corretor_id: string;
  percentual: number;
  tem_8_fotos: boolean;
  updated_at: string;
}

export function useSimplePropertyQuality() {
  const [loading, setLoading] = useState(false);

  const calculateQuality = useCallback(async (imovelId: string): Promise<number> => {
    setLoading(true);
    try {
      // Buscar dados do imóvel
      const { data: imovelData, error: imovelError } = await supabase
        .from('imoveis')
        .select('title, description, bathrooms, bedrooms, parking, area_built, area_total, price')
        .eq('id', imovelId)
        .single();

      if (imovelError) throw imovelError;

      // Buscar imagens do imóvel
      const { data: imagesData, error: imagesError } = await supabase
        .from('imovel_images')
        .select('id')
        .eq('imovel_id', imovelId);

      if (imagesError) throw imagesError;

      // Calcular qualidade baseado em critérios simples
      let qualityScore = 0;
      let maxScore = 0;

      // Critério 1: Título preenchido (10 pontos)
      maxScore += 10;
      if (imovelData.title && imovelData.title.trim().length > 0) {
        qualityScore += 10;
      }

      // Critério 2: Descrição preenchida (15 pontos)
      maxScore += 15;
      if (imovelData.description && imovelData.description.trim().length > 50) {
        qualityScore += 15;
      }

      // Critério 3: Preço informado (10 pontos)
      maxScore += 10;
      if (imovelData.price && imovelData.price > 0) {
        qualityScore += 10;
      }

      // Critério 4: Dados básicos preenchidos (20 pontos)
      maxScore += 20;
      let basicDataScore = 0;
      if (imovelData.bathrooms && imovelData.bathrooms > 0) basicDataScore += 5;
      if (imovelData.bedrooms && imovelData.bedrooms > 0) basicDataScore += 5;
      if (imovelData.parking !== null && imovelData.parking >= 0) basicDataScore += 5;
      if (imovelData.area_built && imovelData.area_built > 0) basicDataScore += 5;
      qualityScore += basicDataScore;

      // Critério 5: Imagens (25 pontos)
      maxScore += 25;
      const imageCount = imagesData?.length || 0;
      if (imageCount >= 8) {
        qualityScore += 25;
      } else if (imageCount >= 5) {
        qualityScore += 20;
      } else if (imageCount >= 3) {
        qualityScore += 15;
      } else if (imageCount >= 1) {
        qualityScore += 10;
      }

      // Critério 6: Área total informada (20 pontos)
      maxScore += 20;
      if (imovelData.area_total && imovelData.area_total > 0) {
        qualityScore += 20;
      }

      // Calcular percentual final
      const finalPercentage = maxScore > 0 ? Math.round((qualityScore / maxScore) * 100) : 0;
      
      return finalPercentage;
    } catch (error) {
      console.error('Error calculating quality:', error);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQualityRecord = useCallback(async (imovelId: string, corretorId: string) => {
    try {
      const qualityPercentage = await calculateQuality(imovelId);
      
      // Verificar se tem 8+ fotos
      const { data: imagesData } = await supabase
        .from('imovel_images')
        .select('id')
        .eq('imovel_id', imovelId);
      
      const tem8Fotos = (imagesData?.length || 0) >= 8;

      // Atualizar ou criar registro de qualidade
      const { error } = await supabase
        .from('imoveis_quality')
        .upsert({
          imovel_id: imovelId,
          corretor_id: corretorId,
          percentual: qualityPercentage,
          tem_8_fotos: tem8Fotos,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      return { qualityPercentage, tem8Fotos };
    } catch (error) {
      console.error('Error updating quality record:', error);
      return null;
    }
  }, [calculateQuality]);

  return {
    calculateQuality,
    updateQualityRecord,
    loading
  };
}