/**
 * Ferramenta de diagnóstico de autenticação
 * Execute no console: runAuthDiagnostics()
 */

export const runAuthDiagnostics = () => {
  console.log('🔍 =====================================');
  console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO');
  console.log('🔍 =====================================');
  console.log('');
  
  // 1. Verificar localStorage
  console.log('📦 VERIFICANDO LOCALSTORAGE:');
  const authData = localStorage.getItem('sb-paawojkqrggnuvpnnwrc-auth-token');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const refreshLength = parsed.refresh_token?.length || 0;
      const accessLength = parsed.access_token?.length || 0;
      
      console.log('  ✅ Auth data encontrado');
      console.log('  📏 Refresh token length:', refreshLength, refreshLength >= 100 ? '✅' : '❌ MUITO CURTO!');
      console.log('  📏 Access token length:', accessLength, accessLength >= 500 ? '✅' : '❌ MUITO CURTO!');
      console.log('  ⏰ Expires at:', new Date(parsed.expires_at * 1000).toLocaleString());
      
      if (refreshLength < 100 || accessLength < 500) {
        console.error('  ⚠️⚠️⚠️ TOKENS CORROMPIDOS DETECTADOS! ⚠️⚠️⚠️');
      }
    } catch (e) {
      console.error('  ❌ Auth data corrompido (JSON inválido)');
      console.error('  Error:', e);
    }
  } else {
    console.log('  ⚠️ Nenhum auth data encontrado (usuário não está logado)');
  }
  console.log('');
  
  // 2. Verificar environment
  console.log('🌍 VERIFICANDO ENVIRONMENT:');
  console.log('  Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('  Current origin:', window.location.origin);
  console.log('  Current path:', window.location.pathname);
  console.log('  Mode:', import.meta.env.MODE);
  console.log('');
  
  // 3. Verificar sessionStorage
  console.log('💾 VERIFICANDO SESSIONSTORAGE:');
  console.log('  corrupted-session-cleaned:', sessionStorage.getItem('corrupted-session-cleaned'));
  console.log('  initial-cleanup-done:', sessionStorage.getItem('initial-cleanup-done'));
  console.log('');
  
  // 4. Verificar cookies
  console.log('🍪 VERIFICANDO COOKIES:');
  if (document.cookie) {
    const cookies = document.cookie.split(';').map(c => c.trim());
    cookies.forEach(cookie => {
      if (cookie.includes('sb-')) {
        console.log('  ', cookie.substring(0, 50) + '...');
      }
    });
  } else {
    console.log('  Nenhum cookie encontrado');
  }
  console.log('');
  
  // 5. Verificar todas as chaves do localStorage
  console.log('🔑 TODAS AS CHAVES NO LOCALSTORAGE:');
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('sb-')) {
      console.log('  ', key);
    }
  });
  console.log('');
  
  console.log('🔍 =====================================');
  console.log('🔍 FIM DO DIAGNÓSTICO');
  console.log('🔍 =====================================');
};

// Expor globalmente para facilitar uso no console
if (typeof window !== 'undefined') {
  (window as any).runAuthDiagnostics = runAuthDiagnostics;
  console.log('💡 Ferramenta de diagnóstico disponível! Execute: runAuthDiagnostics()');
}
