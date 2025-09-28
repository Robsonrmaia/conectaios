// Clean emergency type suppression
declare global {
  interface Window {
    __SUPABASE_COMPAT_MODE__: boolean;
  }
}

// Set compatibility mode
if (typeof window !== 'undefined') {
  window.__SUPABASE_COMPAT_MODE__ = true;
}

export const suppressAllTypes = (data: any) => data as any;