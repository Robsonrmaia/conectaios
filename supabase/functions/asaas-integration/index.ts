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

    const body = await req.json();
    const { action, data } = body;

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
        response = await fetch('https://www.asaas.com/api/v3/customers', {
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
            externalReference: data.externalReference
          })
        });
        break;

      case 'create_payment':
        // Criar cobrança no Asaas
        console.log('Creating payment in Asaas...');
        response = await fetch('https://www.asaas.com/api/v3/payments', {
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
        break;

      case 'get_payment':
        // Consultar cobrança
        console.log('Getting payment from Asaas...');
        response = await fetch(`https://www.asaas.com/api/v3/payments/${data.paymentId}`, {
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

        response = await fetch(`https://www.asaas.com/api/v3/payments?${params.toString()}`, {
          method: 'GET',
          headers: asaasHeaders
        });
        break;

      case 'cancel_payment':
        // Cancelar cobrança
        console.log('Canceling payment in Asaas...');
        response = await fetch(`https://www.asaas.com/api/v3/payments/${data.paymentId}`, {
          method: 'DELETE',
          headers: asaasHeaders
        });
        break;

      case 'create_subscription':
        // Criar assinatura
        console.log('Creating subscription in Asaas...');
        response = await fetch('https://www.asaas.com/api/v3/subscriptions', {
          method: 'POST',
          headers: asaasHeaders,
          body: JSON.stringify({
            customer: data.customerId,
            billingType: data.billingType,
            value: data.value,
            nextDueDate: data.nextDueDate,
            cycle: data.cycle, // 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'
            description: data.description,
            endDate: data.endDate,
            maxPayments: data.maxPayments,
            externalReference: data.externalReference
          })
        });
        break;

      case 'webhook_payment':
        // Processar webhook de pagamento
        console.log('Processing payment webhook...');
        
        const { event, payment } = data;
        
        // Registrar evento no banco
        const { error: logError } = await supabase
          .from('asaas_webhooks')
          .insert({
            event_type: event,
            payment_id: payment.id,
            payment_status: payment.status,
            payment_value: payment.value,
            customer_id: payment.customer,
            external_reference: payment.externalReference,
            webhook_data: data,
            processed_at: new Date().toISOString()
          });

        if (logError) {
          console.error('Error logging webhook:', logError);
        }

        // Atualizar status do deal se existe referência externa
        if (payment.externalReference && payment.externalReference.startsWith('deal_')) {
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