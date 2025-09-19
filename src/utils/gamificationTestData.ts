// Utility functions for testing gamification system

import { supabase } from '@/integrations/supabase/client';

export interface TestGamificationData {
  brokerId: string;
  propertyId?: string;
}

/**
 * Generate test data for gamification system
 * This is for testing purposes only - remove in production
 */
export async function generateTestGamificationData(brokerId: string) {
  try {
    console.log('Generating test gamification data for broker:', brokerId);

    // Simulate various gamification events
    const testEvents = [
      // Fast responses to matches
      {
        action: 'process_match_response',
        ref_id: 'test-match-1',
        meta: {
          usuario_id: brokerId,
          response_time_seconds: 1800 // 30 minutes
        }
      },
      {
        action: 'process_match_response', 
        ref_id: 'test-match-2',
        meta: {
          usuario_id: brokerId,
          response_time_seconds: 3600 // 1 hour
        }
      },
      // Social interactions
      {
        action: 'add_social_interaction',
        usuario_id: brokerId,
        meta: {
          interaction_type: 'share',
          canal: 'whatsapp',
          ref_id: 'test-property-1'
        }
      },
      {
        action: 'add_social_interaction',
        usuario_id: brokerId,
        meta: {
          interaction_type: 'like',
          canal: 'instagram'
        }
      },
      // Direct points for testing
      {
        action: 'add_points',
        usuario_id: brokerId,
        rule_key: 'anuncio_vendido_alugado',
        pontos: 25,
        ref_tipo: 'property',
        ref_id: 'test-property-sold',
        meta: { test: true }
      }
    ];

    // Execute test events
    for (const event of testEvents) {
      const { data, error } = await supabase.functions.invoke('gamification-events', {
        body: event
      });
      
      if (error) {
        console.error('Error executing test event:', error);
      } else {
        console.log('Test event executed:', event.action, data);
      }

      // Small delay between events
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Test gamification data generated successfully!');
    return true;

  } catch (error) {
    console.error('Error generating test data:', error);
    return false;
  }
}

/**
 * Reset user's gamification data (for testing)
 */
export async function resetGamificationData(brokerId: string) {
  try {
    console.log('Resetting gamification data for broker:', brokerId);

    // Delete events
    const { error: eventsError } = await supabase
      .from('gam_events')
      .delete()
      .eq('usuario_id', brokerId);

    if (eventsError) {
      console.error('Error deleting events:', eventsError);
    }

    // Delete monthly data
    const { error: monthlyError } = await supabase
      .from('gam_user_monthly')
      .delete()
      .eq('usuario_id', brokerId);

    if (monthlyError) {
      console.error('Error deleting monthly data:', monthlyError);
    }

    // Delete visibility boost
    const { error: boostError } = await supabase
      .from('gam_visibility_boost')
      .delete()
      .eq('usuario_id', brokerId);

    if (boostError) {
      console.error('Error deleting visibility boost:', boostError);
    }

    console.log('Gamification data reset successfully!');
    return true;

  } catch (error) {
    console.error('Error resetting gamification data:', error);
    return false;
  }
}

/**
 * Simulate property quality check
 */
export async function testPropertyQuality(propertyId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('gamification-events', {
      body: {
        action: 'check_property_quality',
        ref_id: propertyId
      }
    });

    if (error) {
      console.error('Error testing property quality:', error);
      return null;
    }

    console.log('Property quality test result:', data);
    return data;

  } catch (error) {
    console.error('Error testing property quality:', error);
    return null;
  }
}

/**
 * Get current month string for testing
 */
export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Utility to test webhook endpoints
 */
export async function testSocialWebhook(userId: string, tipo: 'share' | 'like' | 'comment', canal?: string) {
  try {
    // This would be called from external services in production
    const response = await fetch('/api/social-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-key': 'conectaios-social-2024' // Test key
      },
      body: JSON.stringify({
        usuario_id: userId,
        tipo,
        canal,
        imovel_id: 'test-property-' + Date.now(),
        meta: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });

    const data = await response.json();
    console.log('Social webhook test result:', data);
    return data;

  } catch (error) {
    console.error('Error testing social webhook:', error);
    return null;
  }
}