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

    const { plan_id, name, email, phone, cpf_cnpj } = await req.json();

    const asaasEnv = Deno.env.get('ASAAS_ENV') || 'sandbox';
    console.log('📝 Creating Asaas checkout link for plan:', plan_id);
    console.log('🔧 Sandbox mode:', asaasEnv, '- Auto-applying test CPF if needed');

    // Validação básica
    if (!plan_id) {
      throw new Error('plan_id é obrigatório');
    }

    // Sanitizar e validar CPF/CNPJ
    let cpfCnpjLimpo = cpf_cnpj?.replace(/\D/g, '') || '';
    
    // Se estiver em sandbox e CPF/CNPJ inválido, usar CPF de teste
    if (asaasEnv === 'sandbox' && (!cpfCnpjLimpo || cpfCnpjLimpo.length < 11)) {
      cpfCnpjLimpo = '11144477735'; // CPF de teste válido do Asaas
      console.log('⚠️ Usando CPF de teste para sandbox');
    } else if (cpfCnpjLimpo.length !== 11 && cpfCnpjLimpo.length !== 14) {
      throw new Error('CPF/CNPJ inválido. Deve ter 11 (CPF) ou 14 (CNPJ) dígitos.');
    }

    // Valores dos planos (preço promocional)
    const PLAN_PRICES: Record<string, { promo: number; regular: number }> = {
      basic: { promo: 49.00, regular: 98.00 },
      pro: { promo: 79.00, regular: 148.00 },
      enterprise: { promo: 99.00, regular: 198.00 },
    };

    const PLAN_NAMES: Record<string, string> = {
      basic: 'Básico',
      pro: 'Profissional',
      enterprise: 'Premium',
    };

    const planInfo = PLAN_PRICES[plan_id];
    const planName = PLAN_NAMES[plan_id];

    if (!planInfo) {
      throw new Error('Plano inválido');
    }

    // Configuração do Asaas
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasUrl = asaasEnv === 'production' 
      ? 'https://api.asaas.com/v3' 
      : 'https://sandbox.asaas.com/api/v3';

    // Gerar external reference único
    const externalReference = `signup_${plan_id}_${Date.now()}`;

    // Criar cliente temporário no Asaas (será completado após pagamento)
    console.log('🏦 Creating temporary Asaas customer...');
    const customerResponse = await fetch(`${asaasUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey!,
      },
      body: JSON.stringify({
        name: name || 'Novo Cliente ConectaIOS',
        email: email || `temp_${Date.now()}@conectaios.com`,
        phone: phone || '',
        cpfCnpj: cpfCnpjLimpo,
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

    // Criar assinatura com desconto de 50% nos 3 primeiros meses
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
        value: planInfo.regular,
        nextDueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${planName} - ConectaIOS (50% OFF nos 3 primeiros meses)`,
        externalReference,
        discount: {
          value: 50,
          dueDateLimitDays: 0,
          type: 'PERCENTAGE',
          limitCycles: 3
        }
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('❌ Asaas subscription creation failed:', error);
      throw new Error(`Erro ao criar assinatura no Asaas: ${error}`);
    }

    const asaasSubscription = await subscriptionResponse.json();
    console.log('✅ Asaas subscription created:', asaasSubscription.id);

    // Aguardar geração da primeira cobrança
    console.log('⏳ Waiting for payment generation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Buscar a primeira cobrança
    let checkoutUrl = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!checkoutUrl && attempts < maxAttempts) {
      attempts++;
      console.log(`🔍 Attempt ${attempts} to fetch payment...`);

      const paymentsResponse = await fetch(
        `${asaasUrl}/payments?subscription=${asaasSubscription.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey!,
          },
        }
      );

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();

        if (paymentsData.data && paymentsData.data.length > 0) {
          const firstPayment = paymentsData.data[0];
          checkoutUrl = firstPayment.invoiceUrl;
          console.log('✅ Checkout URL found:', checkoutUrl);
          break;
        }
      }

      if (!checkoutUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Fallback: criar cobrança manual se não encontrou
    if (!checkoutUrl) {
      console.log('⚠️ Creating manual payment...');
      
      const manualPaymentResponse = await fetch(`${asaasUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey!,
        },
        body: JSON.stringify({
          customer: asaasCustomer.id,
          billingType: 'UNDEFINED',
          value: planInfo.promo,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          description: `Primeira cobrança - ${planName} - ConectaIOS (Promocional)`,
          externalReference,
        }),
      });

      if (manualPaymentResponse.ok) {
        const manualPayment = await manualPaymentResponse.json();
        checkoutUrl = manualPayment.invoiceUrl;
        console.log('✅ Manual payment created:', manualPayment.id);
      }
    }

    // Fallback final
    if (!checkoutUrl) {
      console.log('⚠️ Using fallback customer URL');
      checkoutUrl = `https://www.asaas.com/c/${asaasCustomer.id}`;
    }

    // Salvar signup pendente
    const { data: pendingSignup, error: signupError } = await supabase
      .from('pending_signups')
      .insert({
        email: email || `temp_${Date.now()}@conectaios.com`,
        name: name || 'Novo Cliente',
        phone: phone || '',
        cpf_cnpj: cpf_cnpj || '',
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
      // Não falhar se não conseguir criar pending signup
    } else {
      console.log('✅ Pending signup created:', pendingSignup.id);
    }

    console.log('🎯 Final checkout URL:', checkoutUrl);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl,
        pendingSignupId: pendingSignup?.id,
        asaasCustomerId: asaasCustomer.id,
        asaasSubscriptionId: asaasSubscription.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in create-asaas-checkout-link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
