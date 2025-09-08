import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Asaas Integration Function Started ===');
  console.log('Request method:', req.method);

  try {
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurado');
    }

    // Determine API base URL based on environment
    const asaasEnv = Deno.env.get('ASAAS_ENV') || 'SANDBOX';
    const asaasApiBase = Deno.env.get('ASAAS_API_BASE') 
      ?? (asaasEnv === 'SANDBOX'
          ? 'https://sandbox.asaas.com/api/v3'
          : 'https://www.asaas.com/api/v3');

    console.log(`Using Asaas environment: ${asaasEnv}`);
    console.log(`API Base URL: ${asaasApiBase}`);

    const body = await req.json();
    let { action, data } = body;

    // Auto-detect Asaas webhook (no action, has event/payment)
    if (!action && (body.event || body.payment)) {
      console.log('Detected Asaas webhook');
      action = 'handle_webhook';
      data = body;
    }

    if (!action) {
      throw new Error('Ação não especificada');
    }

    console.log('Action:', action);
    console.log('Data:', data);

    const asaasHeaders = {
      'Content-Type': 'application/json',
      'access_token': asaasApiKey
    };

    let response;

    switch (action) {
      case 'create_customer':
        // Criar cliente no Asaas
        console.log('Creating customer in Asaas...');
        console.log('Customer data:', JSON.stringify(data, null, 2));
        
        response = await fetch(`${asaasApiBase}/customers`, {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            mobilePhone: data.mobilePhone,
            cpfCnpj: data.cpfCnpj,
            postalCode: data.postalCode,
            address: data.address,
            addressNumber: data.addressNumber,
            complement: data.complement,
            province: data.province,
            city: data.city,
            state: data.state,
            externalReference: data.externalReference,
            notificationDisabled: data.notificationDisabled || false
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Asaas customer API error:', errorText);
          throw new Error(`Erro na API Asaas: ${response.status} - ${errorText}`);
        }
        break;

      case 'verify_customer':
        // Verificar se cliente existe
        console.log('Verifying customer in Asaas...');
        response = await fetch(`${asaasApiBase}/customers/${data.customerId}`, {
          method: 'GET',
          headers: asaasHeaders
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Customer verification error:', errorText);
          throw new Error(`Erro ao verificar cliente: ${response.status} - ${errorText}`);
        }
        break;

      case 'create_payment':
        // Criar cobrança no Asaas
        console.log('Creating payment in Asaas...');
        response = await fetch(`${asaasApiBase}/payments`, {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify({
            customer: data.customerId,
            billingType: data.billingType, // 'BOLETO', 'CREDIT_CARD', 'PIX', etc.
            value: data.value,
            dueDate: data.dueDate,
            description: data.description,
            externalReference: data.externalReference,
            installmentCount: data.installmentCount,
            installmentValue: data.installmentValue,
            discount: data.discount,
            interest: data.interest,
            fine: data.fine,
            postalService: data.postalService
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Asaas payment API error:', errorText);
          throw new Error(`Erro na API Asaas: ${response.status} - ${errorText}`);
        }
        break;

      case 'get_payment':
        // Consultar cobrança
        console.log('Getting payment from Asaas...');
        response = await fetch(`${asaasApiBase}/payments/${data.paymentId}`, {
          method: 'GET',
          headers: asaasHeaders
        });
        break;

      case 'list_payments':
        // Listar cobranças
        console.log('Listing payments from Asaas...');
        const params = new URLSearchParams();
        if (data.customer) params.append('customer', data.customer);
        if (data.status) params.append('status', data.status);
        if (data.dateCreated) params.append('dateCreated[ge]', data.dateCreated);
        if (data.limit) params.append('limit', data.limit.toString());
        if (data.offset) params.append('offset', data.offset.toString());

        response = await fetch(`${asaasApiBase}/payments?${params.toString()}`, {
          method: 'GET',
          headers: asaasHeaders
        });
        break;

      case 'cancel_payment':
        // Cancelar cobrança
        console.log('Canceling payment in Asaas...');
        response = await fetch(`${asaasApiBase}/payments/${data.paymentId}`, {
          method: 'DELETE',
          headers: asaasHeaders
        });
        break;

      case 'create_subscription':
        // Criar assinatura sem dados de cartão (para usar checkout)
        console.log('Creating subscription in Asaas...');
        console.log('Customer ID being used:', data.customer || data.customerId);
        
        const subscriptionData = {
          customer: data.customer || data.customerId,
          billingType: data.billingType || 'UNDEFINED', // Deixar cliente escolher
          value: data.value,
          nextDueDate: data.nextDueDate,
          cycle: data.cycle, // 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'
          description: data.description,
          externalReference: data.externalReference
          // Removido: creditCard e creditCardHolderInfo para usar checkout
        };

        console.log('Subscription data being sent:', JSON.stringify(subscriptionData, null, 2));

        response = await fetch(`${asaasApiBase}/subscriptions`, {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify(subscriptionData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Asaas subscription API error:', errorText);
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          throw new Error(`Erro na API Asaas: ${response.status} - ${errorText}`);
        }
        
        const subscriptionResult = await response.json();
        console.log('Subscription created successfully:', subscriptionResult);
        
        // Criar cobrança única para forçar URL de checkout
        const paymentData = {
          customer: data.customer || data.customerId,
          billingType: 'UNDEFINED',
          value: data.value,
          dueDate: data.nextDueDate,
          description: data.description,
          externalReference: data.externalReference + '_payment'
        };

        console.log('Creating payment for checkout URL...');
        const paymentResponse = await fetch(`${asaasApiBase}/payments`, {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify(paymentData)
        });

        if (paymentResponse.ok) {
          const paymentResult = await paymentResponse.json();
          console.log('Payment created for checkout:', paymentResult);
          
          // Retornar subscription com URL de checkout do payment
          return new Response(
            JSON.stringify({
              success: true,
              data: subscriptionResult,
              checkoutUrl: paymentResult.invoiceUrl || paymentResult.bankSlipUrl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Para subscription, retornar direto o resultado
        return new Response(
          JSON.stringify({
            success: true,
            data: subscriptionResult,
            checkoutUrl: subscriptionResult.invoiceUrl || null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'handle_webhook':
        // Processar webhook de pagamento do Asaas
        console.log('Processing Asaas webhook...');
        
        const { event, payment } = data;
        
        // Registrar evento no banco
        const { error: logError } = await supabase
          .from('asaas_webhooks')
          .insert({
            event_type: event,
            payment_id: payment?.id,
            payment_status: payment?.status,
            payment_value: payment?.value,
            customer_id: payment?.customer,
            external_reference: payment?.externalReference,
            webhook_data: data
          });

        if (logError) {
          console.error('Error logging webhook:', logError);
        }

        // Atualizar status do deal se existe referência externa
        if (payment?.externalReference && payment.externalReference.startsWith('deal_')) {
          const dealId = payment.externalReference.replace('deal_', '');
          
          let dealStatus = 'pendente';
          if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
            dealStatus = 'pago';
          } else if (payment.status === 'OVERDUE') {
            dealStatus = 'vencido';
          }

          const { error: dealError } = await supabase
            .from('deals')
            .update({ 
              payment_status: dealStatus,
              asaas_payment_id: payment.id,
              paid_at: payment.status === 'CONFIRMED' ? new Date().toISOString() : null
            })
            .eq('id', dealId);

          if (dealError) {
            console.error('Error updating deal:', dealError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'webhook_payment':
        // Manter compatibilidade com chamadas antigas
        console.log('Processing payment webhook (legacy)...');
        
        const webhookEvent = data.event;
        const webhookPayment = data.payment;
        
        // Registrar evento no banco
        const { error: legacyLogError } = await supabase
          .from('asaas_webhooks')
          .insert({
            event_type: webhookEvent,
            payment_id: webhookPayment.id,
            payment_status: webhookPayment.status,
            payment_value: webhookPayment.value,
            customer_id: webhookPayment.customer,
            external_reference: webhookPayment.externalReference,
            webhook_data: data
          });

        if (legacyLogError) {
          console.error('Error logging webhook:', legacyLogError);
        }

        // Atualizar status do deal se existe referência externa
        if (webhookPayment.externalReference && webhookPayment.externalReference.startsWith('deal_')) {
          const dealId = webhookPayment.externalReference.replace('deal_', '');
          
          let dealStatus = 'pendente';
          if (webhookPayment.status === 'CONFIRMED' || webhookPayment.status === 'RECEIVED') {
            dealStatus = 'pago';
          } else if (webhookPayment.status === 'OVERDUE') {
            dealStatus = 'vencido';
          }

          const { error: dealError } = await supabase
            .from('deals')
            .update({ 
              payment_status: dealStatus,
              asaas_payment_id: webhookPayment.id,
              paid_at: webhookPayment.status === 'CONFIRMED' ? new Date().toISOString() : null
            })
            .eq('id', dealId);

          if (dealError) {
            console.error('Error updating deal:', dealError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error(`Ação não suportada: ${action}`);
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Asaas API error:', errorData);
      throw new Error(`Erro na API Asaas: ${response.status} - ${errorData}`);
    }

    const asaasData = await response.json();
    console.log('Asaas response:', asaasData);

    return new Response(
      JSON.stringify({
        success: true,
        data: asaasData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Asaas integration:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});