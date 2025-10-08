import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { email } = await req.json();

    console.log('🔗 Claiming subscription for user:', user.id, 'email:', email);

    // Buscar signup pendente
    const { data: pendingSignup, error: signupError } = await supabase
      .from('pending_signups')
      .select('*')
      .eq('email', email)
      .eq('claimed', false)
      .single();

    if (signupError || !pendingSignup) {
      console.error('❌ No pending signup found for:', email);
      throw new Error('Nenhuma assinatura pendente encontrada para este email');
    }

    console.log('✅ Found pending signup:', pendingSignup.id);

    // Criar broker para o usuário
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .insert({
        user_id: user.id,
        name: pendingSignup.name,
        email: pendingSignup.email,
        phone: pendingSignup.phone,
        cpf_cnpj: pendingSignup.cpf_cnpj,
        asaas_customer_id: pendingSignup.asaas_customer_id,
        subscription_status: 'active',
        plan_id: pendingSignup.plan_id,
      })
      .select()
      .single();

    if (brokerError) {
      console.error('❌ Error creating broker:', brokerError);
      throw new Error('Erro ao criar perfil de corretor');
    }

    console.log('✅ Broker created:', broker.id);

    // Criar subscription vinculada
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        profile_id: user.id,
        plan_id: pendingSignup.plan_id,
        status: 'active',
        asaas_subscription_id: pendingSignup.asaas_subscription_id,
        asaas_customer_id: pendingSignup.asaas_customer_id,
      });

    if (subscriptionError) {
      console.error('⚠️ Error creating subscription record:', subscriptionError);
    }

    // Marcar signup como claimed
    const { error: updateError } = await supabase
      .from('pending_signups')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: user.id,
      })
      .eq('id', pendingSignup.id);

    if (updateError) {
      console.error('⚠️ Error updating pending signup:', updateError);
    }

    console.log('✅ Subscription claimed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        broker,
        message: 'Assinatura vinculada com sucesso',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in claim-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
