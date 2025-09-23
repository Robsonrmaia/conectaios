import { supabase } from '@/integrations/supabase/client';

// Test function to manually trigger gamification events
export async function testPropertyQualityScoring(propertyId: string, brokerId: string) {
  try {
    console.log('🧪 Testing property quality scoring...');
    console.log('Property ID:', propertyId);
    console.log('Broker ID:', brokerId);

    // First, test the quality calculation function
    const { data: qualityData, error: qualityError } = await supabase
      .rpc('calc_imovel_quality', { imovel_id: propertyId });

    if (qualityError) {
      console.error('❌ Error calculating quality:', qualityError);
      return { success: false, error: qualityError };
    }

    console.log('📊 Property quality score:', qualityData);

    // Now test the gamification event
    const { data: gamificationData, error: gamificationError } = await supabase.functions.invoke('gamification-events', {
      body: {
        action: 'process_property_event',
        property_id: propertyId,
        event_type: 'created', 
        broker_id: brokerId
      }
    });

    if (gamificationError) {
      console.error('❌ Error triggering gamification:', gamificationError);
      return { success: false, error: gamificationError };
    }

    console.log('🎮 Gamification result:', gamificationData);

    return { 
      success: true, 
      quality: qualityData, 
      gamification: gamificationData 
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error };
  }
}

// Test function accessible from browser console
(window as any).testPropertyQualityScoring = testPropertyQualityScoring;