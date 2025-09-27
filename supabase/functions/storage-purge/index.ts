// FASE 2: Edge Function para limpeza controlada do Storage
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const allowPurge = Deno.env.get('ALLOW_SAMPLE_PURGE') === 'true';
    
    if (!allowPurge) {
      return new Response(
        JSON.stringify({ error: 'Sample purge not enabled' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    console.log('Starting storage purge operation...');

    // Lista todos os arquivos em imoveis/public
    const { data: publicFiles, error: listError } = await adminClient.storage
      .from('imoveis')
      .list('public', { 
        limit: 1000, 
        offset: 0, 
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing public files:', listError);
      return new Response(
        JSON.stringify({ error: listError.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filesToDelete: string[] = [];

    // Processa arquivos e diretórios
    for (const entry of publicFiles || []) {
      if (entry.id && entry.name) {
        // Se for diretório, lista conteúdo recursivo
        const { data: innerFiles } = await adminClient.storage
          .from('imoveis')
          .list(`public/${entry.name}`, { limit: 1000 });

        for (const file of innerFiles || []) {
          if (file.name) {
            filesToDelete.push(`public/${entry.name}/${file.name}`);
          }
        }
      } else if (entry.name) {
        // Arquivo direto em /public
        filesToDelete.push(`public/${entry.name}`);
      }
    }

    console.log(`Found ${filesToDelete.length} files to delete`);

    // Remove arquivos em lotes
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await adminClient.storage
        .from('imoveis')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Successfully removed ${filesToDelete.length} files`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        removed: filesToDelete.length,
        files: filesToDelete 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    } catch (error: any) {
      console.error('Storage purge error:', error);
      return new Response(
        JSON.stringify({ error: error?.message || 'Unknown error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
});