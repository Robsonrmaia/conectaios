// Runtime configuration with strict validation
export const RUNTIME = (() => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL;
  
  if (!url || !key) {
    // Evitar fallback silencioso - sempre falhar se env ausente
    const allowLocal = import.meta.env.DEV && import.meta.env.VITE_ALLOW_LOCAL_CONFIG === 'true';
    
    if (!allowLocal) {
      throw new Error('Supabase env ausente: verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    }
    
    console.warn('⚠️ Usando configuração local - apenas permitido em desenvolvimento');
  }
  
  return { 
    url: url || "https://paawojkqrggnuvpnnwrc.supabase.co", 
    key: key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYXdvamtxcmdnbnV2cG5ud3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjcwMjIsImV4cCI6MjA3NDUwMzAyMn0.w6GWfIyEvcYDsG1W4J0yatSx-ueTm6_m7Qkj-GvxEIU",
    siteUrl: siteUrl || "https://www.conectaios.com.br",
    projectId: "paawojkqrggnuvpnnwrc"
  };
})();

// Helper para verificação de saúde
export const healthCheck = async () => {
  try {
    const response = await fetch(`${RUNTIME.url}/rest/v1/imoveis?select=id&limit=1`, {
      headers: {
        'apikey': RUNTIME.key,
        'Content-Type': 'application/json'
      }
    });
    return {
      status: response.status,
      projectRef: RUNTIME.projectId,
      isSupabaseUrl: RUNTIME.url.endsWith('.supabase.co'),
      connected: response.ok || response.status === 403 // 403 é esperado para RLS
    };
  } catch (error) {
    return {
      status: 0,
      projectRef: RUNTIME.projectId,
      isSupabaseUrl: RUNTIME.url.endsWith('.supabase.co'),
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};