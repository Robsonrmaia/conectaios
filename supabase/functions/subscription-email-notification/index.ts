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
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://conectaios.lovable.app';

    switch (email_type) {
      case 'PAYMENT_CONFIRMED':
        subject = '✅ Pagamento Confirmado - ConectaIOS';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">Pagamento Confirmado!</h1>
            </div>
            <h2>Olá${broker.name ? `, ${broker.name}` : ''}!</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Seu pagamento foi <strong>confirmado com sucesso</strong>! Agora você precisa completar seu cadastro.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>📋 Detalhes da assinatura:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Status: Ativa</li>
                <li>Vencimento: ${new Date(broker.subscription_expires_at).toLocaleDateString('pt-BR')}</li>
              </ul>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Próximo Passo Importante:</p>
              <p style="margin: 10px 0 0 0; color: #92400e;">
                Você precisa criar sua senha para acessar a plataforma. Clique no botão abaixo:
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/signup-complete?token=${subscription_id}" 
                 style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                🔐 Criar Minha Senha
              </a>
            </div>

            <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
                <strong>💡 Dica:</strong> Salve este email! Você pode usar este link a qualquer momento para completar seu cadastro.
              </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Obrigado por confiar na ConectaIOS! 🎉
            </p>
          </div>
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
        subject = '⏳ Aguardando Confirmação de Pagamento - ConectaIOS';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Pedido Recebido!</h1>
            </div>
            <h2>Olá${broker.name ? `, ${broker.name}` : ''}!</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Recebemos sua solicitação de assinatura! Estamos aguardando a confirmação do pagamento.
            </p>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 18px; margin: 0; color: #1e40af;">
                <strong>⏳ Status:</strong> Aguardando Pagamento
              </p>
            </div>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">⏱️ Tempo de confirmação:</p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                <li><strong>PIX:</strong> Até 5 minutos</li>
                <li><strong>Cartão de Crédito:</strong> Imediato</li>
                <li><strong>Boleto:</strong> Até 2 dias úteis</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              Você receberá outro email assim que o pagamento for confirmado, com as instruções para criar sua senha e acessar a plataforma.
            </p>
          </div>
        `;
        break;

      case 'SUBSCRIPTION_SUSPENDED':
        subject = '⚠️ Assinatura Suspensa - ConectaIOS';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0;">⚠️ Assinatura Suspensa</h1>
            </div>
            <h2>Olá${broker.name ? `, ${broker.name}` : ''}!</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              <strong>Sua assinatura foi suspensa</strong> devido a pagamento em atraso.
            </p>
            
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #991b1b;">
                Para reativar sua conta e continuar usando o ConectaIOS:
              </p>
              <p style="margin: 0; color: #991b1b;">
                Regularize seu pagamento o quanto antes para não perder acesso às suas funcionalidades.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/app/perfil" 
                 style="background: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                💳 Regularizar Pagamento
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              <strong>Observação:</strong> Se você já realizou o pagamento, por favor desconsidere este email. A confirmação pode levar alguns minutos.
            </p>
          </div>
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
