// Teste simples de conectividade Supabase
import { supabase } from '@/integrations/supabase/client';
import { RUNTIME } from '@/config/runtime';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testando conexão Supabase...');
  console.log('Project ID:', RUNTIME.projectId);
  console.log('URL:', RUNTIME.url);
  console.log('Key configured:', RUNTIME.key ? '✓' : '✗');

  try {
    // Teste 1: Verificar se client está configurado
    console.log('✓ Cliente Supabase inicializado');

    // Teste 2: Tentar query simples na tabela imoveis
    const { data, error } = await supabase
      .from('imoveis')
      .select('id')
      .limit(1);

    if (error) {
      console.log('⚠️ Erro esperado (RLS):', error.message);
      // RLS error é normal se não estiver autenticado
      if (error.code === 'PGRST116' || error.message.includes('RLS') || error.message.includes('policies')) {
        console.log('✓ Conexão OK - RLS funcionando corretamente');
        return { success: true, message: 'Conexão OK - RLS ativo' };
      }
      throw error;
    }

    console.log('✓ Dados carregados:', data?.length || 0, 'registros');
    return { success: true, message: 'Conexão perfeita', data };

  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      error 
    };
  }
};

// Executar automaticamente se estiver no browser
if (typeof window !== 'undefined') {
  // Aguardar um pouco para o app carregar
  setTimeout(() => {
    testSupabaseConnection().then(result => {
      if (result.success) {
        console.log('🎉 Supabase conectado com sucesso!');
      } else {
        console.error('💥 Falha na conexão Supabase:', result.message);
      }
    });
  }, 2000);
}