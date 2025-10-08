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

    // Buscar webhooks com erro que não foram reprocessados com sucesso
    const { data: failedWebhooks, error: fetchError } = await supabase
      .from('asaas_webhooks')
      .select('*')
      .eq('processed', false)
      .not('error', 'is', null)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📋 Found ${failedWebhooks?.length || 0} failed webhooks to retry`);

    const results = [];

    for (const webhook of failedWebhooks || []) {
      // Verificar se já tentou demais (max 3 tentativas)
      const { data: retries, error: retriesError } = await supabase
        .from('asaas_webhook_retries')
        .select('*')
        .eq('webhook_id', webhook.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (retriesError) {
        console.error(`❌ Error checking retries for webhook ${webhook.id}:`, retriesError);
        continue;
      }

      const lastAttempt = retries?.[0]?.attempt_number || 0;
      
      if (lastAttempt >= 3) {
        console.log(`⏭️ Skipping webhook ${webhook.id} - max retries reached`);
        continue;
      }

      console.log(`🔄 Retrying webhook ${webhook.id} (attempt ${lastAttempt + 1})`);

      try {
        // Reprocessar webhook chamando a função asaas-integration
        const { data: retryResult, error: retryError } = await supabase.functions.invoke('asaas-integration', {
          body: {
            action: 'handle_webhook',
            webhook_data: webhook
          }
        });

        const success = !retryError;

        // Registrar tentativa
        await supabase.from('asaas_webhook_retries').insert({
          webhook_id: webhook.id,
          attempt_number: lastAttempt + 1,
          success,
          error: retryError ? JSON.stringify(retryError) : null
        });

        if (success) {
          // Marcar webhook como processado
          await supabase
            .from('asaas_webhooks')
            .update({ processed: true, processed_at: new Date().toISOString(), error: null })
            .eq('id', webhook.id);

          console.log(`✅ Successfully reprocessed webhook ${webhook.id}`);
          results.push({ webhook_id: webhook.id, success: true });
        } else {
          console.error(`❌ Failed to reprocess webhook ${webhook.id}:`, retryError);
          results.push({ webhook_id: webhook.id, success: false, error: retryError });
        }
      } catch (error) {
        console.error(`❌ Exception retrying webhook ${webhook.id}:`, error);
        
        await supabase.from('asaas_webhook_retries').insert({
          webhook_id: webhook.id,
          attempt_number: lastAttempt + 1,
          success: false,
          error: error.message
        });

        results.push({ webhook_id: webhook.id, success: false, error: error.message });
      }

      // Pequeno delay entre tentativas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in webhook retry:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
