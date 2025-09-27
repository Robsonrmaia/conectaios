import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-key',
};

// Simple app key for webhook security (replace with env var in production)
const APP_KEY = Deno.env.get('SOCIAL_WEBHOOK_KEY') || 'conectaios-social-2024';

interface SocialWebhookRequest {
  usuario_id: string;
  tipo: 'share' | 'like' | 'comment';
  canal?: 'instagram' | 'facebook' | 'whatsapp' | 'twitter';
  imovel_id?: string;
  meta?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify app key for security
    const appKey = req.headers.get('x-app-key');
    if (appKey !== APP_KEY) {
      return new Response(
        JSON.stringify({ error: 'Invalid app key' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: SocialWebhookRequest = await req.json();
    console.log('Social webhook request:', body);

    // Validate required fields
    if (!body.usuario_id || !body.tipo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: usuario_id, tipo' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user's IP for rate limiting
    const userIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

    // Check rate limiting (max 20 social interactions per day per user)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayInteractions, error: rateLimitError } = await supabaseClient
      .from('gam_events')
      .select('id')
      .eq('usuario_id', body.usuario_id)
      .in('rule_key', ['compartilhamento_social', 'interacao_social'])
      .gte('created_at', today)
      .lt('created_at', today + ' 23:59:59');

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (todayInteractions && todayInteractions.length >= 20) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily social interaction limit reached (20/day)',
          current_count: todayInteractions.length 
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check for duplicate interactions (prevent spam)
    const deduplicationKey = `${body.usuario_id}-${body.tipo}-${body.imovel_id || 'general'}-${today}`;
    const { data: existingInteraction } = await supabaseClient
      .from('gam_events')
      .select('id')
      .eq('usuario_id', body.usuario_id)
      .eq('ref_id', body.imovel_id || null)
      .eq('rule_key', body.tipo === 'share' ? 'compartilhamento_social' : 'interacao_social')
      .gte('created_at', today)
      .limit(1);

    if (existingInteraction && existingInteraction.length > 0 && body.tipo === 'share') {
      // Allow only one share per property per day
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Share already recorded today',
          points_awarded: 0 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Add social interaction through gamification system
    const gamificationResponse = await supabaseClient.functions.invoke('gamification-events', {
      body: {
        action: 'add_social_interaction',
        usuario_id: body.usuario_id,
        meta: {
          interaction_type: body.tipo,
          canal: body.canal,
          ref_id: body.imovel_id,
          ip_address: userIP,
          timestamp: new Date().toISOString(),
          ...body.meta
        }
      }
    });

    if (gamificationResponse.error) {
      console.error('Gamification error:', gamificationResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to process social interaction' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const result = gamificationResponse.data;

    return new Response(
      JSON.stringify({
        success: true,
        points_awarded: result.points_awarded || 0,
        interaction_type: body.tipo,
        canal: body.canal,
        message: `Social interaction recorded successfully`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in social webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);