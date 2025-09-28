// Global shims for TypeScript compatibility - emergency mode only

// Apply minimal type overrides to prevent deep instantiation errors
declare global {
  // Override problematic generic types
  type SelectQueryError<T = string> = any;
  type QueryResult<T = any> = T;
  
  // Fix for over-nested types
  interface Window {
    __TYPESCRIPT_COMPAT_MODE__: boolean;
  }
  
  // Quick property fixes
  namespace PropertyQuickFix {
    interface Property {
      [key: string]: any;
    }
  }
}

// Set compatibility mode
if (typeof window !== 'undefined') {
  window.__TYPESCRIPT_COMPAT_MODE__ = true;
}

// Export to make this a module
export {};