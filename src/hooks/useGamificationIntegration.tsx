import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBroker } from '@/hooks/useBroker';
import { toast } from '@/hooks/use-toast';

export function useGamificationIntegration() {
  const { broker } = useBroker();
  const [processing, setProcessing] = useState(false);

  // Process property quality when property is created/updated
  const processPropertyEvent = async (propertyId: string, eventType: 'created' | 'updated' | 'sold') => {
    if (!broker?.id) return;

    try {
      setProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'process_property_event',
          property_id: propertyId,
          event_type: eventType,
          broker_id: broker.id
        }
      });

      if (error) throw error;

      if (data.success && data.points_awarded > 0) {
        toast({
          title: 'Pontos conquistados!',
          description: `Você ganhou ${data.points_awarded} pontos por ${eventType === 'created' ? 'criar' : eventType === 'updated' ? 'atualizar' : 'vender'} um imóvel`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error processing property event:', error);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  // Process match response with timing
  const processMatchResponse = async (matchId: string, responseTimeSeconds: number) => {
    if (!broker?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'process_match_response',
          match_id: matchId,
          broker_id: broker.id,
          response_time_seconds: responseTimeSeconds
        }
      });

      if (error) throw error;

      if (data.success && data.points_awarded > 0) {
        const timeBonus = responseTimeSeconds <= 3600 ? 'resposta rápida' : 
                         responseTimeSeconds <= 43200 ? 'boa resposta' : 'resposta';
        toast({
          title: 'Pontos por resposta!',
          description: `Você ganhou ${data.points_awarded} pontos por ${timeBonus}`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error processing match response:', error);
      return null;
    }
  };

  // Process rating received
  const processRatingReceived = async (rating: number, evaluationId: string) => {
    if (!broker?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: {
          action: 'process_rating',
          rating,
          evaluation_id: evaluationId,
          broker_id: broker.id
        }
      });

      if (error) throw error;

      if (data.success && data.points_awarded > 0) {
        toast({
          title: 'Pontos por avaliação!',
          description: `Você ganhou ${data.points_awarded} pontos por receber uma avaliação ${rating}★`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error processing rating:', error);
      return null;
    }
  };

  // Process social sharing
  const processSocialShare = async (platform: 'whatsapp' | 'facebook' | 'instagram' | 'telegram', propertyId?: string) => {
    if (!broker?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('social-webhooks', {
        body: {
          action: 'share',
          broker_id: broker.id,
          platform,
          property_id: propertyId
        }
      });

      if (error) throw error;

      if (data.success && data.points_awarded > 0) {
        toast({
          title: 'Pontos sociais!',
          description: `Você ganhou ${data.points_awarded} pontos por compartilhar no ${platform}`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error processing social share:', error);
      return null;
    }
  };

  return {
    processPropertyEvent,
    processMatchResponse,
    processRatingReceived,
    processSocialShare,
    processing
  };
}