import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function processMatchResponse(
  supabase: SupabaseClient,
  matchId: string,
  brokerId: string,
  responseTimeSeconds: number
): Promise<{ success: boolean; points_awarded: number; event: string | null }> {
  try {
    let ruleKey: string;
    let points: number;

    // Determine points based on response time
    if (responseTimeSeconds <= 3600) { // 1 hour
      ruleKey = 'match_1h';
      points = 10;
    } else if (responseTimeSeconds <= 43200) { // 12 hours
      ruleKey = 'match_12h';
      points = 5;
    } else if (responseTimeSeconds <= 86400) { // 24 hours
      ruleKey = 'match_24h';
      points = 2;
    } else {
      // No points for responses after 24 hours
      return {
        success: true,
        points_awarded: 0,
        event: null
      };
    }

    // Apply points
    await supabase.rpc('apply_points', {
      p_usuario_id: brokerId,
      p_rule_key: ruleKey,
      p_pontos: points,
      p_ref_tipo: 'match',
      p_ref_id: matchId,
      p_meta: { 
        response_time_seconds: responseTimeSeconds,
        response_time_hours: Math.round(responseTimeSeconds / 3600 * 100) / 100
      }
    });

    return {
      success: true,
      points_awarded: points,
      event: ruleKey
    };
  } catch (error) {
    console.error('Error processing match response:', error);
    return {
      success: false,
      points_awarded: 0,
      event: null
    };
  }
}

export async function processRating(
  supabase: SupabaseClient,
  rating: number,
  evaluationId: string,
  brokerId: string
): Promise<{ success: boolean; points_awarded: number; event: string | null }> {
  try {
    let ruleKey: string | null = null;
    let points = 0;

    // Award points based on rating
    if (rating === 5) {
      ruleKey = 'avaliacao_5';
      points = 10;
    } else if (rating === 4) {
      ruleKey = 'avaliacao_4';
      points = 5;
    }

    if (ruleKey) {
      await supabase.rpc('apply_points', {
        p_usuario_id: brokerId,
        p_rule_key: ruleKey,
        p_pontos: points,
        p_ref_tipo: 'avaliacao',
        p_ref_id: evaluationId,
        p_meta: { rating }
      });
    }

    return {
      success: true,
      points_awarded: points,
      event: ruleKey
    };
  } catch (error) {
    console.error('Error processing rating:', error);
    return {
      success: false,
      points_awarded: 0,
      event: null
    };
  }
}