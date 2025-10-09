import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting auto-suspension check...');

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar brokers com status 'overdue' há mais de 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: overduebrokers, error: fetchError } = await supabase
      .from('brokers')
      .select('id, name, email, subscription_status, subscription_expires_at, updated_at')
      .eq('subscription_status', 'overdue')
      .lt('subscription_expires_at', sevenDaysAgo.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching overdue brokers:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${overduebrokers?.length || 0} brokers to suspend`);

    if (!overduebrokers || overduebrokers.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No brokers to suspend',
        suspended_count: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Suspender cada broker e enviar notificação
    const results = [];
    for (const broker of overduebrokers) {
      try {
        // Update broker status to suspended
        const { error: updateError } = await supabase
          .from('brokers')
          .update({ 
            subscription_status: 'suspended',
            updated_at: new Date().toISOString()
          })
          .eq('id', broker.id);

        if (updateError) {
          console.error(`❌ Error suspending broker ${broker.id}:`, updateError);
          results.push({ broker_id: broker.id, success: false, error: updateError.message });
          continue;
        }

        console.log(`✅ Suspended broker: ${broker.name} (${broker.id})`);

        // Enviar email de notificação
        try {
          await supabase.functions.invoke('subscription-email-notification', {
            body: {
              broker_id: broker.id,
              email_type: 'SUBSCRIPTION_SUSPENDED',
              status: 'suspended'
            }
          });
          console.log(`📧 Sent suspension email to ${broker.email}`);
        } catch (emailError) {
          console.error(`⚠️ Failed to send email to ${broker.email}:`, emailError);
          // Continue even if email fails
        }

        // Log audit
        await supabase.from('audit_log').insert({
          action: 'AUTO_SUSPEND',
          entity: 'broker',
          entity_id: broker.id,
          meta: {
            reason: 'Payment overdue for more than 7 days',
            old_status: 'overdue',
            new_status: 'suspended',
            expires_at: broker.subscription_expires_at
          },
          actor: null,
          at: new Date().toISOString()
        });

        results.push({ broker_id: broker.id, success: true, broker_name: broker.name });

      } catch (error: any) {
        console.error(`❌ Error processing broker ${broker.id}:`, error);
        results.push({ broker_id: broker.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Auto-suspension complete: ${successCount}/${results.length} brokers suspended`);

    return new Response(JSON.stringify({ 
      message: 'Auto-suspension completed',
      suspended_count: successCount,
      total_processed: results.length,
      results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error in auto-suspend function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
