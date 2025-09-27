import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://1a061622-528a-4152-a7b5-09817795ad8f.sandbox.lovable.dev",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff"
};

interface RegistrationData {
  full_name: string;
  email: string;
  phone: string;
  creci: string;
  city: string;
  region: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const registrationData: RegistrationData = await req.json();

    // Input validation and sanitization
    if (!registrationData.full_name?.trim() || !registrationData.email?.trim() || 
        !registrationData.phone?.trim() || !registrationData.city?.trim() || 
        !registrationData.region?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs to prevent injection attacks
    const sanitizedData = {
      full_name: registrationData.full_name.trim().replace(/<[^>]*>/g, '').substring(0, 100),
      email: registrationData.email.trim().toLowerCase().substring(0, 254),
      phone: registrationData.phone.replace(/[^\d\-\(\)\s]/g, '').substring(0, 20),
      creci: registrationData.creci?.trim().replace(/[^a-zA-Z0-9\-]/g, '').substring(0, 20) || '',
      city: registrationData.city.trim().replace(/[<>]/g, '').substring(0, 100),
      region: registrationData.region.trim().replace(/[<>]/g, '').substring(0, 100)
    };

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove sensitive data logging
    console.log('Registration processed for:', sanitizedData.email);

    // Create Supabase client with service role for inserting data
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Save sanitized registration to database
    const { error: dbError } = await supabaseAdmin
      .from('broker_registrations')
      .insert([sanitizedData]);

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Erro ao salvar registro: ' + dbError.message);
    }

    // Send email notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "ConectaIOS <noreply@conectaios.com.br>",
      to: ["giselecarneirocorretora@gmail.com"],
      subject: "Nova Inscrição de Corretor - ConectaIOS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0B82C7; border-bottom: 2px solid #5BDBF5; padding-bottom: 10px;">
            Nova Inscrição de Corretor
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Dados do Corretor:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px;">Nome:</td>
                <td style="padding: 8px 0;">${sanitizedData.full_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;">${sanitizedData.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Telefone:</td>
                <td style="padding: 8px 0;">${sanitizedData.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">CRECI:</td>
                <td style="padding: 8px 0;">${sanitizedData.creci || 'Não informado'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Cidade:</td>
                <td style="padding: 8px 0;">${sanitizedData.city}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Região:</td>
                <td style="padding: 8px 0;">${sanitizedData.region}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Data da inscrição: ${new Date().toLocaleString('pt-BR')}
          </p>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;">
              <strong>Próximos passos:</strong><br>
              • Entre em contato com o corretor para validar os dados<br>
              • Crie o acesso na plataforma ConectaIOS<br>
              • Envie as instruções de primeiro acesso
            </p>
          </div>
        </div>
      `,
    });

    if (adminEmailResponse.error) {
      console.error('Admin email error:', adminEmailResponse.error);
      throw new Error('Erro ao enviar email para administrador');
    }

    console.log('Admin email sent successfully:', adminEmailResponse);

    // Send welcome email to the broker
    const welcomeEmailResponse = await resend.emails.send({
      from: "ConectaIOS <noreply@conectaios.com.br>",
      to: [sanitizedData.email],
      subject: "Bem-vindo ao ConectaIOS!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0B82C7, #5BDBF5); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo ao ConectaIOS!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
              A plataforma que conecta corretores e oportunidades
            </p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
            <p>Olá <strong>${sanitizedData.full_name}</strong>,</p>
            
            <p>Obrigado por se cadastrar no ConectaIOS! Recebemos sua inscrição e nossa equipe entrará em contato em breve para:</p>
            
            <ul style="line-height: 1.8;">
              <li>Validar seus dados e credenciais</li>
              <li>Criar seu acesso personalizado à plataforma</li>
              <li>Apresentar todas as funcionalidades disponíveis</li>
              <li>Ajudar no setup inicial do seu perfil</li>
            </ul>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0B82C7;">O que você pode esperar:</h3>
              <p style="margin: 0;">
                ✓ <strong>CRM integrado</strong> para gestão de clientes<br>
                ✓ <strong>Sistema de matches</strong> inteligente<br>
                ✓ <strong>Mini site personalizado</strong> para seus imóveis<br>
                ✓ <strong>Chat interno</strong> com outros corretores<br>
                ✓ <strong>Ferramentas de negociação</strong> transparentes
              </p>
            </div>
            
            <p>Em caso de dúvidas, responda este email ou entre em contato conosco.</p>
            
            <p style="margin-top: 30px;">
              Atenciosamente,<br>
              <strong>Equipe ConectaIOS</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            ConectaIOS - Conectando corretores, transformando negócios
          </div>
        </div>
      `,
    });

    if (welcomeEmailResponse.error) {
      console.error('Welcome email error:', welcomeEmailResponse.error);
      // Don't throw error here, as the registration was successful
    }

    console.log('Welcome email sent successfully:', welcomeEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Registro realizado com sucesso! Entraremos em contato em breve." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in registration function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Erro interno do servidor" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);