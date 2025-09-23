// Manual test function to be run in browser console
async function testGamificationManual() {
  const supabase = (window as any).supabase || (await import('@/integrations/supabase/client')).supabase;
  
  console.log('🧪 Starting manual gamification test...');
  
  const propertyId = '9fb73d59-6f06-4abd-8b5d-4cadaca832d6';
  const brokerId = '08ab7af3-2128-4af7-a078-0a078d608901';
  
  try {
    // Test the gamification function directly
    const { data, error } = await supabase.functions.invoke('gamification-events', {
      body: {
        action: 'process_property_event',  
        property_id: propertyId,
        event_type: 'created',
        broker_id: brokerId
      }
    });
    
    console.log('📋 Gamification response:', { data, error });
    
    if (error) {
      console.error('❌ Gamification error:', error);
      return { success: false, error };
    }
    
    // Check if events were created
    const { data: events, error: eventsError } = await supabase
      .from('gam_events')
      .select('*')
      .eq('usuario_id', brokerId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    console.log('📊 Recent events:', events);
    
    return { success: true, data, events };
  } catch (error) {
    console.error('💥 Test failed:', error);
    return { success: false, error };
  }
}

// Make available globally
(window as any).testGamificationManual = testGamificationManual;