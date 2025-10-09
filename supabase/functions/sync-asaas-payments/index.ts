import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const asaasApiKey = Deno.env.get('ASAAS_API_KEY')!;
const asaasEnv = Deno.env.get('ASAAS_ENV') || 'sandbox';

const asaasApiBase = asaasEnv === 'production' 
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

// Helper para mapear status do Asaas para o nosso sistema
function mapAsaasStatusToPaymentStatus(asaasStatus: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'RECEIVED': 'confirmed',
    'CONFIRMED': 'confirmed',
    'OVERDUE': 'overdue',
    'REFUNDED': 'refunded',
    'RECEIVED_IN_CASH': 'confirmed',
    'REFUND_REQUESTED': 'refunded',
    'CHARGEBACK_REQUESTED': 'refunded',
    'CHARGEBACK_DISPUTE': 'refunded',
    'AWAITING_CHARGEBACK_REVERSAL': 'refunded'
  };
  
  return statusMap[asaasStatus] || 'pending';
}

// Helper para mapear tipo de pagamento
function mapBillingType(billingType: string): string | null {
  const typeMap: Record<string, string> = {
    'PIX': 'pix',
    'CREDIT_CARD': 'credit_card',
    'BOLETO': 'boleto',
    'DEBIT_CARD': 'debit_card',
    'TRANSFER': 'transfer'
  };
  
  return typeMap[billingType] || null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Iniciando sincronização de pagamentos Asaas...');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar todos os brokers com assinatura ativa
    const { data: brokers, error: brokersError } = await supabase
      .from('brokers')
      .select('id, asaas_customer_id, subscription_status')
      .not('asaas_customer_id', 'is', null)
      .neq('subscription_status', 'cancelled');

    if (brokersError) {
      throw new Error(`Erro ao buscar brokers: ${brokersError.message}`);
    }

    console.log(`📊 Encontrados ${brokers?.length || 0} brokers para sincronizar`);

    let totalSynced = 0;
    let totalErrors = 0;

    // 2. Para cada broker, buscar pagamentos no Asaas
    for (const broker of brokers || []) {
      if (!broker.asaas_customer_id) continue;

      try {
        console.log(`🔍 Sincronizando broker ${broker.id}...`);

        // Buscar últimos pagamentos do cliente no Asaas
        const asaasResponse = await fetch(
          `${asaasApiBase}/payments?customer=${broker.asaas_customer_id}&limit=20`,
          {
            method: 'GET',
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!asaasResponse.ok) {
          throw new Error(`Asaas API error: ${asaasResponse.status}`);
        }

        const asaasData = await asaasResponse.json();
        const payments = asaasData.data || [];

        console.log(`  📄 Encontrados ${payments.length} pagamentos no Asaas`);

        // 3. Sincronizar cada pagamento
        for (const payment of payments) {
          const paymentData = {
            broker_id: broker.id,
            asaas_payment_id: payment.id,
            subscription_id: payment.subscription,
            amount: payment.value,
            status: mapAsaasStatusToPaymentStatus(payment.status),
            payment_method: mapBillingType(payment.billingType),
            due_date: payment.dueDate,
            paid_at: payment.paymentDate,
            invoice_url: payment.invoiceUrl,
            description: payment.description || `Pagamento ${payment.billingType}`,
            metadata: {
              asaas_status: payment.status,
              billing_type: payment.billingType,
              external_reference: payment.externalReference,
              nosso_numero: payment.nossoNumero
            }
          };

          // Upsert na tabela subscription_payments
          const { error: upsertError } = await supabase
            .from('subscription_payments')
            .upsert(paymentData, {
              onConflict: 'asaas_payment_id',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error(`  ❌ Erro ao sincronizar pagamento ${payment.id}:`, upsertError);
            totalErrors++;
          } else {
            totalSynced++;
          }

          // 4. Atualizar status do broker se necessário
          if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
            const nextBilling = new Date(payment.dueDate);
            nextBilling.setMonth(nextBilling.getMonth() + 1);

            await supabase
              .from('brokers')
              .update({
                subscription_status: 'active',
                subscription_expires_at: nextBilling.toISOString()
              })
              .eq('id', broker.id);
          } else if (payment.status === 'OVERDUE') {
            await supabase
              .from('brokers')
              .update({
                subscription_status: 'overdue'
              })
              .eq('id', broker.id);
          }
        }

        console.log(`  ✅ Broker ${broker.id} sincronizado com sucesso`);

      } catch (error) {
        console.error(`  ❌ Erro ao sincronizar broker ${broker.id}:`, error);
        totalErrors++;
      }
    }

    const result = {
      success: true,
      message: 'Sincronização concluída',
      stats: {
        brokers_processed: brokers?.length || 0,
        payments_synced: totalSynced,
        errors: totalErrors
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Sincronização finalizada:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
