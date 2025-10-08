import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { broker_id, subscription_id, email_type, status } = await req.json();

    console.log(`📧 Sending ${email_type} email for broker ${broker_id}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar dados do broker
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('name, email')
      .eq('id', broker_id)
      .single();

    if (brokerError || !broker) {
      throw new Error('Broker not found');
    }

    if (!broker.email) {
      throw new Error('Broker email not found');
    }

    // Preparar email baseado no tipo
    let subject = '';
    let html = '';

    switch (email_type) {
      case 'subscription_created':
        subject = 'Assinatura Criada com Sucesso! 🎉';
        html = `
          <h1>Olá ${broker.name}!</h1>
          <p>Sua assinatura foi criada com sucesso.</p>
          <p>Complete o pagamento para ativar todos os recursos da plataforma.</p>
          <p><strong>Status:</strong> ${status}</p>
          <br>
          <p>Obrigado por escolher ConectaIOS!</p>
        `;
        break;

      case 'subscription_active':
        subject = 'Sua Assinatura está Ativa! ✅';
        html = `
          <h1>Parabéns ${broker.name}!</h1>
          <p>Sua assinatura foi ativada com sucesso.</p>
          <p>Agora você tem acesso a todos os recursos premium da plataforma!</p>
          <br>
          <p>Aproveite ao máximo o ConectaIOS!</p>
        `;
        break;

      case 'subscription_overdue':
        subject = 'Assinatura em Atraso ⚠️';
        html = `
          <h1>Atenção ${broker.name}</h1>
          <p>Identificamos que sua assinatura está com pagamento em atraso.</p>
          <p>Por favor, regularize sua situação para continuar aproveitando todos os recursos.</p>
          <br>
          <p>Equipe ConectaIOS</p>
        `;
        break;

      case 'subscription_suspended':
        subject = 'Assinatura Suspensa';
        html = `
          <h1>Olá ${broker.name}</h1>
          <p>Sua assinatura foi suspensa devido a pagamento não realizado.</p>
          <p>Regularize sua situação para reativar o acesso completo à plataforma.</p>
          <br>
          <p>Equipe ConectaIOS</p>
        `;
        break;

      case 'subscription_cancelled':
        subject = 'Assinatura Cancelada';
        html = `
          <h1>Olá ${broker.name}</h1>
          <p>Confirmamos o cancelamento da sua assinatura.</p>
          <p>Sentimos muito em vê-lo partir. Se quiser voltar, estaremos aqui!</p>
          <br>
          <p>Equipe ConectaIOS</p>
        `;
        break;

      default:
        subject = 'Atualização da Assinatura';
        html = `
          <h1>Olá ${broker.name}</h1>
          <p>Houve uma atualização no status da sua assinatura.</p>
          <p><strong>Status atual:</strong> ${status}</p>
          <br>
          <p>Equipe ConectaIOS</p>
        `;
    }

    // Enviar email via Resend
    if (!RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY not configured, skipping email send');
      
      // Log mesmo assim
      await supabase.from('subscription_email_logs').insert({
        broker_id,
        subscription_id,
        email_type,
        sent_to: broker.email,
        success: false,
        error: 'RESEND_API_KEY not configured'
      });

      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ConectaIOS <noreply@conectaios.com.br>',
        to: [broker.email],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();
    const success = emailResponse.ok;

    // Registrar log
    await supabase.from('subscription_email_logs').insert({
      broker_id,
      subscription_id,
      email_type,
      sent_to: broker.email,
      success,
      error: success ? null : JSON.stringify(emailResult)
    });

    if (!success) {
      console.error('❌ Email send failed:', emailResult);
      throw new Error('Failed to send email');
    }

    console.log('✅ Email sent successfully');

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
