// Deno/Edge — remove arquivo do Storage + registro do BD, validando ownership.
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

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }
    
    const { imovel_id, image_id, storage_path } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!; // para ler com o JWT do usuário
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // para operar storage

    console.log('🗑️ Deleting image:', { imovel_id, image_id, storage_path });

    // 1) Recuperar usuário do token
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { 
        headers: { 
          Authorization: req.headers.get('Authorization') ?? '' 
        } 
      }
    });
    
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) {
      console.error('❌ Unauthorized:', userErr);
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }
    
    const uid = userData.user.id;
    console.log('👤 User ID:', uid);

    // 2) Validar ownership do imóvel
    const { data: imovel, error: qErr } = await authClient
      .from('imoveis')
      .select('id, owner_id')
      .eq('id', imovel_id)
      .single();
      
    if (qErr) {
      console.error('❌ Query error:', qErr);
      return new Response(qErr.message, { 
        status: 400,
        headers: corsHeaders 
      });
    }
    
    if (!imovel || imovel.owner_id !== uid) {
      console.error('❌ Forbidden - not owner:', { imovel, uid });
      return new Response('Forbidden', { 
        status: 403,
        headers: corsHeaders 
      });
    }

    console.log('✅ Ownership validated');

    // 3) Remover arquivo do storage e registro no BD (service role)
    const admin = createClient(supabaseUrl, serviceRole);
    
    const { error: rmErr } = await admin.storage
      .from('imoveis')
      .remove([storage_path]);
      
    if (rmErr) {
      console.error('❌ Storage removal error:', rmErr);
      return new Response(rmErr.message, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log('🗑️ File removed from storage');

    if (image_id) {
      const { error: dbDelErr } = await admin
        .from('imovel_images')
        .delete()
        .eq('id', image_id)
        .eq('imovel_id', imovel_id);
        
      if (dbDelErr) {
        console.error('❌ Database deletion error:', dbDelErr);
        return new Response(dbDelErr.message, { 
          status: 400,
          headers: corsHeaders 
        });
      }
      
      console.log('🗑️ Database record removed');
    }

    console.log('✅ Image deleted successfully');

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }, 
      status: 200
    });
  } catch (e: any) {
    console.error('💥 Unexpected error:', e);
    return new Response(String(e?.message ?? e), { 
      status: 500,
      headers: corsHeaders 
    });
  }
});