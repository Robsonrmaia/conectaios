import { supabase } from '@/integrations/supabase/client';

// Simple test function to manually trigger gamification events
export async function testPropertyQualityScoring(propertyId: string, brokerId: string) {
  try {
    console.log('🧪 Testing property quality scoring...');
    console.log('Property ID:', propertyId);
    console.log('Broker ID:', brokerId);

    // Test quality by fetching property data
    const { data: property, error: propertyError } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('❌ Error fetching property:', propertyError);
      return { success: false, error: propertyError };
    }

    console.log('📊 Property data:', property);

    // Test gamification event by creating a manual event
    const { data: gamificationData, error: gamificationError } = await supabase
      .from('gam_events')
      .insert({
        usuario_id: brokerId,
        rule_key: 'property_created',
        pontos: 10,
        ref_tipo: 'property',
        ref_id: propertyId,
        meta: { test: true }
      })
      .select()
      .single();

    if (gamificationError) {
      console.error('❌ Error creating gamification event:', gamificationError);
      return { success: false, error: gamificationError };
    }

    console.log('🎮 Gamification event created:', gamificationData);

    return { 
      success: true, 
      property: property, 
      gamification: gamificationData 
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error };
  }
}

// Test function accessible from browser console
(window as any).testPropertyQualityScoring = testPropertyQualityScoring;