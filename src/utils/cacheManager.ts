// Cache management utility to prevent loading issues
const CACHE_VERSION = '1.0.1';
const CACHE_VERSION_KEY = 'conectaios_cache_version';

export class CacheManager {
  static checkAndClearStaleCache() {
    try {
      const currentVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (currentVersion !== CACHE_VERSION) {
        console.log('🧹 Clearing stale cache due to version mismatch');
        this.clearAppCache();
        localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      }
    } catch (error) {
      console.error('Error checking cache version:', error);
    }
  }

  static clearAppCache() {
    try {
      // Clear specific app-related cache keys, but keep auth tokens
      const keysToKeep = [
        'supabase.auth.token',
        'sb-paawojkqrggnuvpnnwrc-auth-token'
      ];
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.some(keepKey => key.includes(keepKey))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      
      console.log('✅ App cache cleared successfully');
    } catch (error) {
      console.error('Error clearing app cache:', error);
    }
  }

  static clearAllCache() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 All cache cleared');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  static isStaleSession(): boolean {
    try {
      const lastActivity = localStorage.getItem('last_activity');
      if (!lastActivity) return false;
      
      const lastTime = new Date(lastActivity).getTime();
      const now = new Date().getTime();
      const hoursSinceLastActivity = (now - lastTime) / (1000 * 60 * 60);
      
      return hoursSinceLastActivity > 24; // Consider stale after 24 hours
    } catch (error) {
      return false;
    }
  }

  static updateActivity() {
    try {
      localStorage.setItem('last_activity', new Date().toISOString());
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }

  static invalidateMarketplaceCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('marketplace_properties_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🔄 Marketplace cache invalidated');
    } catch (error) {
      console.error('Error invalidating marketplace cache:', error);
    }
  }

  static invalidateMinisiteCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('minisite_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🔄 Minisite cache invalidated');
    } catch (error) {
      console.error('Error invalidating minisite cache:', error);
    }
  }

  static invalidatePropertyCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('property_') || key.startsWith('imovel_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🔄 Property cache invalidated');
    } catch (error) {
      console.error('Error invalidating property cache:', error);
    }
  }

  static addCacheBusting(url: string): string {
    if (!url) return url;
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
  }
}
