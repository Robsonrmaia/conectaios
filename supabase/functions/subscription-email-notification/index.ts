import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  broker_id: string;
  subscription_id?: string;
  email_type: 'PAYMENT_CONFIRMED' | 'PAYMENT_OVERDUE' | 'PAYMENT_PENDING' | 'SUBSCRIPTION_SUSPENDED';
  status: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { broker_id, subscription_id, email_type, status }: EmailRequest = await req.json();
    
    console.log('📧 Email notification request:', { broker_id, email_type, status });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch broker details
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id, name, email, subscription_status, subscription_expires_at')
      .eq('id', broker_id)
      .single();

    if (brokerError || !broker) {
      console.error('❌ Error fetching broker:', brokerError);
      throw new Error('Broker not found');
    }

    if (!broker.email) {
      console.error('❌ Broker has no email:', broker_id);
      throw new Error('Broker email not found');
    }

    // Email subject and content based on type
    let subject = '';
    let htmlContent = '';

    switch (email_type) {
      case 'PAYMENT_CONFIRMED':
        subject = '✅ Pagamento Confirmado - ConectaIOS';
        htmlContent = `
          <h1>Pagamento Confirmado!</h1>
          <p>Olá <strong>${broker.name}</strong>,</p>
          <p>Seu pagamento foi confirmado com sucesso.</p>
          <p>Sua assinatura está <strong>ativa</strong> e você pode continuar usando todos os recursos do ConectaIOS.</p>
          <p>Data de vencimento: ${broker.subscription_expires_at ? new Date(broker.subscription_expires_at).toLocaleDateString('pt-BR') : 'Não definido'}</p>
          <br>
          <p>Obrigado por fazer parte do ConectaIOS!</p>
          <p>Equipe ConectaIOS</p>
        `;
        break;

      case 'PAYMENT_OVERDUE':
        subject = '⚠️ Pagamento Atrasado - ConectaIOS';
        htmlContent = `
          <h1>Pagamento em Atraso</h1>
          <p>Olá <strong>${broker.name}</strong>,</p>
          <p>Identificamos que seu pagamento está em atraso.</p>
          <p>Para continuar usando o ConectaIOS sem interrupções, por favor regularize seu pagamento o quanto antes.</p>
          <p><strong>Importante:</strong> Após 7 dias de atraso, sua conta será suspensa automaticamente.</p>
          <br>
          <a href="https://conectaios.com.br/app/checkout" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Regularizar Pagamento</a>
          <br><br>
          <p>Equipe ConectaIOS</p>
        `;
        break;

      case 'PAYMENT_PENDING':
        subject = '⏳ Pagamento Pendente - ConectaIOS';
        htmlContent = `
          <h1>Pagamento Pendente</h1>
          <p>Olá <strong>${broker.name}</strong>,</p>
          <p>Seu pagamento está pendente de confirmação.</p>
          <p>Assim que o pagamento for confirmado, você receberá uma notificação.</p>
          <p>Se você já realizou o pagamento, por favor aguarde a compensação bancária.</p>
          <br>
          <p>Equipe ConectaIOS</p>
        `;
        break;

      case 'SUBSCRIPTION_SUSPENDED':
        subject = '🔒 Assinatura Suspensa - ConectaIOS';
        htmlContent = `
          <h1>Assinatura Suspensa</h1>
          <p>Olá <strong>${broker.name}</strong>,</p>
          <p>Sua assinatura foi <strong>suspensa</strong> devido à falta de pagamento.</p>
          <p>Para reativar sua conta e continuar usando o ConectaIOS, por favor regularize seu pagamento.</p>
          <br>
          <a href="https://conectaios.com.br/app/checkout" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reativar Conta</a>
          <br><br>
          <p>Equipe ConectaIOS</p>
        `;
        break;

      default:
        throw new Error('Invalid email type');
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "ConectaIOS <onboarding@resend.dev>",
      to: [broker.email],
      subject: subject,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', emailResponse);

    // Log email sent to audit
    await supabase.from('audit_log').insert({
      action: 'EMAIL_SENT',
      entity: 'subscription_email',
      entity_id: broker_id,
      meta: {
        email_type,
        status,
        subscription_id,
        email_response: emailResponse
      },
      actor: null,
      at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email sent successfully',
      email_id: emailResponse.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error in email notification function:", error);
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
