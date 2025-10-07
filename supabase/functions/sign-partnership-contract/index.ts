import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignContractRequest {
  partnership_id: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { partnership_id, password }: SignContractRequest = await req.json();

    // Verificar senha usando service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Criar hash simples (em produção usar bcrypt)
    const passwordHash = btoa(password + user.id);

    // Registrar assinatura
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { error: signatureError } = await supabaseClient
      .from('partnership_signatures')
      .upsert({
        partnership_id,
        broker_id: user.id,
        password_hash: passwordHash,
        ip_address: clientIP,
        user_agent: userAgent
      }, {
        onConflict: 'partnership_id,broker_id'
      });

    if (signatureError) {
      console.error('Error creating signature:', signatureError);
      return new Response(
        JSON.stringify({ error: 'Failed to sign contract', details: signatureError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Marcar participante como assinado
    await supabaseClient
      .from('partnership_participants')
      .update({
        signed: true,
        signed_at: new Date().toISOString(),
        signature_ip: clientIP
      })
      .eq('partnership_id', partnership_id)
      .eq('broker_id', user.id);

    // Verificar se todos assinaram
    const { data: participants } = await supabaseClient
      .from('partnership_participants')
      .select('signed')
      .eq('partnership_id', partnership_id);

    const allSigned = participants?.every(p => p.signed) || false;

    if (allSigned) {
      await supabaseClient
        .from('broker_partnerships')
        .update({
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', partnership_id);
    }

    return new Response(
      JSON.stringify({ success: true, all_signed: allSigned }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in sign-partnership-contract:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
