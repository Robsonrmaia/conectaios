import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupEmailRequest {
  email: string;
  name: string;
  token: string;
  planName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, token, planName }: SignupEmailRequest = await req.json();

    console.log('📧 Enviando email de signup para:', email);

    const signupUrl = `${Deno.env.get('SUPABASE_URL')?.replace('https://paawojkqrggnuvpnnwrc.supabase.co', 'https://conectaios.com.br')}/signup-complete?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "ConectaIOS <onboarding@resend.dev>",
      to: [email],
      subject: "Complete seu cadastro ConectaIOS 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #3B82F6 0%, #EF4444 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .button {
                display: inline-block;
                background: #3B82F6;
                color: white !important;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .info-box {
                background: white;
                border-left: 4px solid #3B82F6;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">Bem-vindo ao ConectaIOS! 🎉</h1>
            </div>
            
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              
              <p>Seu pagamento foi confirmado com sucesso! Agora falta só um passo para começar a usar sua conta <strong>Plano ${planName}</strong>.</p>
              
              <div class="info-box">
                <strong>⚡ Próximo passo:</strong>
                <br>
                Clique no botão abaixo para criar sua senha e finalizar seu cadastro.
              </div>
              
              <div style="text-align: center;">
                <a href="${signupUrl}" class="button">
                  Completar Cadastro
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Ou copie e cole este link no seu navegador:<br>
                <a href="${signupUrl}" style="color: #3B82F6; word-break: break-all;">
                  ${signupUrl}
                </a>
              </p>
              
              <div class="info-box">
                <strong>⏰ Link válido por 48 horas</strong>
                <br>
                Este link expira em 48 horas por segurança. Se precisar de ajuda, entre em contato conosco.
              </div>
              
              <p>Se você não solicitou este cadastro, ignore este email.</p>
            </div>
            
            <div class="footer">
              <p>
                <strong>ConectaIOS</strong><br>
                A plataforma completa para corretores de imóveis
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("✅ Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao enviar email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
