import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function processPropertyEvent(
  supabase: SupabaseClient,
  propertyId: string,
  eventType: 'created' | 'updated' | 'sold',
  brokerId: string
): Promise<{ success: boolean; points_awarded: number; events: string[] }> {
  try {
    const events: string[] = [];
    let totalPoints = 0;

    // Get property details
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propError) throw propError;

    // Check property quality
    const { data: qualityResult, error: qualityError } = await supabase
      .rpc('calc_imovel_quality', { imovel_id: propertyId });

    if (qualityError) throw qualityError;

    const qualityPercentage = qualityResult || 0;
    const hasEightPhotos = (property.fotos || []).length >= 8;

    // Award points based on events
    if (eventType === 'created' || eventType === 'updated') {
      // Quality points
      if (qualityPercentage >= 90) {
        await supabase.rpc('apply_points', {
          p_usuario_id: brokerId,
          p_rule_key: 'imovel_qualidade',
          p_pontos: 15,
          p_ref_tipo: 'imovel',
          p_ref_id: propertyId,
          p_meta: { quality_percentage: qualityPercentage }
        });
        events.push('imovel_qualidade');
        totalPoints += 15;
      }

      // Photo count points
      if (hasEightPhotos) {
        await supabase.rpc('apply_points', {
          p_usuario_id: brokerId,
          p_rule_key: 'imovel_8_fotos',
          p_pontos: 2,
          p_ref_tipo: 'imovel',
          p_ref_id: propertyId,
          p_meta: { photo_count: (property.fotos || []).length }
        });
        events.push('imovel_8_fotos');
        totalPoints += 2;
      }
    } else if (eventType === 'sold') {
      // Property sold points
      await supabase.rpc('apply_points', {
        p_usuario_id: brokerId,
        p_rule_key: 'imovel_vendido',
        p_pontos: 50,
        p_ref_tipo: 'imovel',
        p_ref_id: propertyId,
        p_meta: { sale_value: property.valor }
      });
      events.push('imovel_vendido');
      totalPoints += 50;
    }

    // Update property quality record
    await supabase
      .from('imoveis_quality')
      .upsert({
        imovel_id: propertyId,
        corretor_id: brokerId,
        percentual: qualityPercentage,
        tem_8_fotos: hasEightPhotos,
        updated_at: new Date().toISOString()
      });

    return {
      success: true,
      points_awarded: totalPoints,
      events
    };
  } catch (error) {
    console.error('Error processing property event:', error);
    return {
      success: false,
      points_awarded: 0,
      events: []
    };
  }
}