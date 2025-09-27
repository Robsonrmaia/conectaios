// Health check utilities for ConectaIOS SaaS
export function logProjectDiagnostics() {
  if (import.meta.env.DEV) {
    console.log('🔍 ConectaIOS Project Diagnostics:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
    console.log('Expected Project ID: paawojkqrggnuvpnnwrc');
    
    const currentUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const isCorrectProject = currentUrl.includes('paawojkqrggnuvpnnwrc');
    
    if (isCorrectProject) {
      console.log('✅ Project configuration OK');
    } else {
      console.error('❌ Wrong project configuration! Check your .env file');
    }
  }
}

// Run diagnostics on app start
if (import.meta.env.DEV) {
  logProjectDiagnostics();
}