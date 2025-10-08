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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, email, phone, cpf_cnpj, plan_id } = await req.json();

    console.log('📝 Creating public subscription for:', email);

    // Validação básica
    if (!email || !name || !plan_id) {
      throw new Error('Email, nome e plan_id são obrigatórios');
    }

    // Verificar se já existe signup pendente
    const { data: existing } = await supabase
      .from('pending_signups')
      .select('*')
      .eq('email', email)
      .eq('claimed', false)
      .single();

    if (existing) {
      console.log('⚠️ Pending signup already exists for:', email);
      return new Response(
        JSON.stringify({ 
          error: 'Já existe um cadastro pendente para este email',
          existingSignup: existing 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar external reference único
    const externalReference = `signup_${email.split('@')[0]}_${Date.now()}`;

    // Criar cliente no Asaas
    const asaasEnv = Deno.env.get('ASAAS_ENV') || 'sandbox';
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasUrl = asaasEnv === 'production' 
      ? 'https://api.asaas.com/v3' 
      : 'https://sandbox.asaas.com/api/v3';

    console.log('🏦 Creating Asaas customer...');
    const customerResponse = await fetch(`${asaasUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey!,
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        cpfCnpj: cpf_cnpj || '00000000000',
        externalReference,
      }),
    });

    if (!customerResponse.ok) {
      const error = await customerResponse.text();
      console.error('❌ Asaas customer creation failed:', error);
      throw new Error(`Erro ao criar cliente no Asaas: ${error}`);
    }

    const asaasCustomer = await customerResponse.json();
    console.log('✅ Asaas customer created:', asaasCustomer.id);

    // Valores hardcoded dos planos
    const PLAN_PRICES: Record<string, number> = {
      basic: 97.00,
      pro: 147.00,
      enterprise: 197.00,
      api: 297.00,
    };

    const PLAN_NAMES: Record<string, string> = {
      basic: 'Básico',
      pro: 'Profissional',
      enterprise: 'Premium',
      api: 'API Empresarial',
    };

    const planPrice = PLAN_PRICES[plan_id];
    const planName = PLAN_NAMES[plan_id];

    if (!planPrice) {
      throw new Error('Plano inválido');
    }

    // Criar assinatura no Asaas
    console.log('📋 Creating Asaas subscription...');
    const subscriptionResponse = await fetch(`${asaasUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey!,
      },
      body: JSON.stringify({
        customer: asaasCustomer.id,
        billingType: 'UNDEFINED',
        value: planPrice,
        nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${planName} - ConectaIOS`,
        externalReference,
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('❌ Asaas subscription creation failed:', error);
      throw new Error(`Erro ao criar assinatura no Asaas: ${error}`);
    }

    const asaasSubscription = await subscriptionResponse.json();
    console.log('✅ Asaas subscription created:', asaasSubscription.id);

    // Aguardar 2 segundos para a cobrança ser gerada
    console.log('⏳ Aguardando geração da cobrança...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Buscar a primeira cobrança da assinatura
    let checkoutUrl = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!checkoutUrl && attempts < maxAttempts) {
      attempts++;
      console.log(`🔍 Tentativa ${attempts} de buscar cobrança...`);

      const paymentsResponse = await fetch(`${asaasUrl}/payments?subscription=${asaasSubscription.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey!,
        },
      });

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        console.log('📋 Cobranças encontradas:', paymentsData);

        if (paymentsData.data && paymentsData.data.length > 0) {
          const firstPayment = paymentsData.data[0];
          checkoutUrl = firstPayment.invoiceUrl;
          console.log('✅ URL de checkout encontrada:', checkoutUrl);
          break;
        }
      }

      if (!checkoutUrl && attempts < maxAttempts) {
        console.log('⏳ Aguardando mais 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Se não encontrou URL após tentativas, criar cobrança manual
    if (!checkoutUrl) {
      console.log('⚠️ Criando cobrança manual...');
      
      const manualPaymentResponse = await fetch(`${asaasUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey!,
        },
        body: JSON.stringify({
          customer: asaasCustomer.id,
          billingType: 'UNDEFINED',
          value: planPrice,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          description: `Primeira cobrança - Assinatura ${planName} - ConectaIOS`,
          externalReference,
        }),
      });

      if (manualPaymentResponse.ok) {
        const manualPayment = await manualPaymentResponse.json();
        checkoutUrl = manualPayment.invoiceUrl;
        console.log('✅ Cobrança manual criada:', manualPayment.id);
      }
    }

    // Fallback final
    if (!checkoutUrl) {
      console.log('⚠️ Usando URL fallback do cliente');
      checkoutUrl = `https://www.asaas.com/c/${asaasCustomer.id}`;
    }

    // Salvar signup pendente
    const { data: pendingSignup, error: signupError } = await supabase
      .from('pending_signups')
      .insert({
        email,
        name,
        phone,
        cpf_cnpj,
        plan_id,
        asaas_customer_id: asaasCustomer.id,
        asaas_subscription_id: asaasSubscription.id,
        external_reference: externalReference,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (signupError) {
      console.error('❌ Error creating pending signup:', signupError);
      throw signupError;
    }

    console.log('✅ Pending signup created:', pendingSignup.id);

    console.log('🎯 Checkout URL final:', checkoutUrl);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl,
        pendingSignupId: pendingSignup.id,
        asaasCustomerId: asaasCustomer.id,
        asaasSubscriptionId: asaasSubscription.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in create-public-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
