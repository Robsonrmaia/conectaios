// Clean global type declarations
declare global {
  interface Window {
    __SUPABASE_COMPAT_MODE__: boolean;
  }
}

export {};