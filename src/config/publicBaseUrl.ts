/**
 * Public base URL configuration for minisite links.
 * Forces official domain when running on Lovable to avoid sandbox links.
 */

// Check if running on Lovable environment
const isLovableHost = 
  typeof window !== "undefined" && 
  /\.lovable\.(dev|app)$/i.test(window.location.hostname);

// Get environment base URL without trailing slash
const ENV_BASE = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/+$/, "");

/**
 * Official public base URL - always uses production domain
 * Forces production domain for all environments to ensure consistent URLs
 */
export const PUBLIC_BASE_URL = 
  ENV_BASE || "https://www.conectaios.com.br";