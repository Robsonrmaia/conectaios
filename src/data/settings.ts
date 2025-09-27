import { supabase } from '@/integrations/supabase/client';

// Branding data types
export interface Branding {
  logoUrl: string;
  heroUrl: string;
}

// In-memory cache to avoid repeated database calls
let brandingCache: Branding | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get branding URLs from system_settings
export async function getBranding(): Promise<Branding> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (brandingCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return brandingCache;
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['site_logo_url', 'site_hero_url']);

    if (error) {
      console.error('getBranding error:', error);
      return getFallbackBranding();
    }

    if (!data || data.length === 0) {
      console.warn('No branding settings found in database');
      return getFallbackBranding();
    }

    // Extract URLs from the database response
    const getValue = (key: string): string => {
      const setting = data.find(row => row.key === key);
      const value = setting?.value as any;
      return value?.url || '';
    };

    const branding: Branding = {
      logoUrl: getValue('site_logo_url'),
      heroUrl: getValue('site_hero_url')
    };

    // Update cache
    brandingCache = branding;
    cacheTimestamp = now;

    return branding;
  } catch (error) {
    console.error('getBranding unexpected error:', error);
    return getFallbackBranding();
  }
}

// Fallback branding URLs (empty strings to handle gracefully)
function getFallbackBranding(): Branding {
  return {
    logoUrl: '',
    heroUrl: ''
  };
}

// Clear cache (useful for testing or manual refresh)
export function clearBrandingCache(): void {
  brandingCache = null;
  cacheTimestamp = 0;
}

// Update branding settings (admin function)
export async function updateBranding(branding: Branding): Promise<boolean> {
  try {
    const updates = [
      {
        key: 'site_logo_url',
        value: { url: branding.logoUrl }
      },
      {
        key: 'site_hero_url', 
        value: { url: branding.heroUrl }
      }
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: update.key,
          value: update.value,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`Error updating ${update.key}:`, error);
        return false;
      }
    }

    // Clear cache to force reload
    clearBrandingCache();
    return true;
  } catch (error) {
    console.error('updateBranding error:', error);
    return false;
  }
}