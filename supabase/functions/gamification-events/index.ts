import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GamificationEventRequest {
  action: string;
  usuario_id?: string;
  rule_key?: string;
  pontos?: number;
  ref_tipo?: string;
  ref_id?: string;
  meta?: Record<string, any>;
  target_month?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: GamificationEventRequest = await req.json();
    console.log('Gamification event request:', body);

    switch (body.action) {
      case 'add_points':
        return await addPoints(supabaseClient, body);
      case 'check_property_quality':
        return await checkPropertyQuality(supabaseClient, body);
      case 'process_match_response':
        return await processMatchResponse(supabaseClient, body);
      case 'process_property_sold':
        return await processPropertySold(supabaseClient, body);
      case 'add_social_interaction':
        return await addSocialInteraction(supabaseClient, body);
      case 'process_monthly_reset':
        return await processMonthlyReset(supabaseClient);
      case 'get_user_stats':
        return await getUserStats(supabaseClient, body);
      case 'get_leaderboard':
        return await getLeaderboard(supabaseClient);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
  } catch (error) {
    console.error('Error in gamification events:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

async function addPoints(supabaseClient: any, body: GamificationEventRequest) {
  const { usuario_id, rule_key, pontos, ref_tipo, ref_id, meta } = body;

  if (!usuario_id || !rule_key || pontos === undefined) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: usuario_id, rule_key, pontos' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  console.log(`Adding ${pontos} points to user ${usuario_id} for rule ${rule_key}`);

  // Call the apply_points function
  const { error } = await supabaseClient.rpc('apply_points', {
    p_usuario_id: usuario_id,
    p_rule_key: rule_key,
    p_pontos: pontos,
    p_ref_tipo: ref_tipo || null,
    p_ref_id: ref_id || null,
    p_meta: meta || {}
  });

  if (error) {
    console.error('Error applying points:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to apply points' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Points added successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function checkPropertyQuality(supabaseClient: any, body: GamificationEventRequest) {
  const { ref_id: property_id } = body;

  if (!property_id) {
    return new Response(
      JSON.stringify({ error: 'Missing property_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Get property quality and owner
  const { data: qualityData, error: qualityError } = await supabaseClient
    .from('imoveis_quality')
    .select('*')
    .eq('imovel_id', property_id)
    .single();

  if (qualityError || !qualityData) {
    console.error('Error getting property quality:', qualityError);
    return new Response(
      JSON.stringify({ error: 'Property not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const events = [];

  // Award points for high quality (≥90%)
  if (qualityData.percentual >= 90) {
    events.push({
      usuario_id: qualityData.corretor_id,
      rule_key: 'anuncio_qualidade_90',
      pontos: 15,
      ref_tipo: 'property',
      ref_id: property_id,
      meta: { quality_score: qualityData.percentual }
    });
  }

  // Award points for 8+ photos
  if (qualityData.tem_8_fotos) {
    events.push({
      usuario_id: qualityData.corretor_id,
      rule_key: 'anuncio_8_fotos',
      pontos: 5,
      ref_tipo: 'property',
      ref_id: property_id,
      meta: { has_8_photos: true }
    });
  }

  // Apply all events
  for (const event of events) {
    await supabaseClient.rpc('apply_points', {
      p_usuario_id: event.usuario_id,
      p_rule_key: event.rule_key,
      p_pontos: event.pontos,
      p_ref_tipo: event.ref_tipo,
      p_ref_id: event.ref_id,
      p_meta: event.meta
    });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      events_created: events.length,
      quality_score: qualityData.percentual 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function processMatchResponse(supabaseClient: any, body: GamificationEventRequest) {
  const { ref_id: match_id, meta } = body;

  if (!match_id || !meta?.response_time_seconds || !meta?.usuario_id) {
    return new Response(
      JSON.stringify({ error: 'Missing match_id, response_time_seconds, or usuario_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const responseTime = meta.response_time_seconds;
  let rule_key: string;
  let pontos: number;

  // Determine points based on response time
  if (responseTime <= 3600) { // 1 hour
    rule_key = 'match_1h';
    pontos = 10;
  } else if (responseTime <= 43200) { // 12 hours
    rule_key = 'match_12h';
    pontos = 5;
  } else if (responseTime <= 86400) { // 24 hours
    rule_key = 'match_24h';
    pontos = 2;
  } else {
    // No points for responses after 24h
    return new Response(
      JSON.stringify({ success: true, message: 'No points awarded for late response' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Apply points
  const { error } = await supabaseClient.rpc('apply_points', {
    p_usuario_id: meta.usuario_id,
    p_rule_key: rule_key,
    p_pontos: pontos,
    p_ref_tipo: 'match',
    p_ref_id: match_id,
    p_meta: { response_time_seconds: responseTime }
  });

  if (error) {
    console.error('Error applying match response points:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to apply points' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      points_awarded: pontos,
      rule: rule_key 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function processPropertySold(supabaseClient: any, body: GamificationEventRequest) {
  const { ref_id: property_id, usuario_id } = body;

  if (!property_id || !usuario_id) {
    return new Response(
      JSON.stringify({ error: 'Missing property_id or usuario_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Apply points for sold/rented property
  const { error } = await supabaseClient.rpc('apply_points', {
    p_usuario_id: usuario_id,
    p_rule_key: 'anuncio_vendido_alugado',
    p_pontos: 25,
    p_ref_tipo: 'property',
    p_ref_id: property_id,
    p_meta: { event_type: 'property_sold' }
  });

  if (error) {
    console.error('Error applying property sold points:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to apply points' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      points_awarded: 25,
      message: 'Points awarded for property sale' 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function addSocialInteraction(supabaseClient: any, body: GamificationEventRequest) {
  const { usuario_id, meta } = body;

  if (!usuario_id || !meta?.interaction_type) {
    return new Response(
      JSON.stringify({ error: 'Missing usuario_id or interaction_type' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const interactionType = meta.interaction_type;
  let rule_key: string;
  let pontos: number;

  if (interactionType === 'share') {
    rule_key = 'compartilhamento_social';
    pontos = 3;
  } else if (['like', 'comment'].includes(interactionType)) {
    rule_key = 'interacao_social';
    pontos = 1;
  } else {
    return new Response(
      JSON.stringify({ error: 'Invalid interaction_type' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Check for rate limiting (max 10 social interactions per day)
  const today = new Date().toISOString().split('T')[0];
  const { data: todayEvents } = await supabaseClient
    .from('gam_events')
    .select('id')
    .eq('usuario_id', usuario_id)
    .in('rule_key', ['compartilhamento_social', 'interacao_social'])
    .gte('created_at', today)
    .lt('created_at', today + ' 23:59:59');

  if (todayEvents && todayEvents.length >= 10) {
    return new Response(
      JSON.stringify({ error: 'Daily social interaction limit reached' }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const { error } = await supabaseClient.rpc('apply_points', {
    p_usuario_id: usuario_id,
    p_rule_key: rule_key,
    p_pontos: pontos,
    p_ref_tipo: 'social',
    p_ref_id: meta.ref_id || null,
    p_meta: meta
  });

  if (error) {
    console.error('Error applying social interaction points:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to apply points' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      points_awarded: pontos,
      interaction_type: interactionType 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function processMonthlyReset(supabaseClient: any) {
  console.log('Processing monthly gamification reset...');

  const { data, error } = await supabaseClient.rpc('process_monthly_gamification_reset');

  if (error) {
    console.error('Error processing monthly reset:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process monthly reset' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function getUserStats(supabaseClient: any, body: GamificationEventRequest) {
  const { usuario_id } = body;

  if (!usuario_id) {
    return new Response(
      JSON.stringify({ error: 'Missing usuario_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Get current month stats
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const { data: monthlyData, error: monthlyError } = await supabaseClient
    .from('gam_user_monthly')
    .select('*')
    .eq('usuario_id', usuario_id)
    .eq('ano', currentYear)
    .eq('mes', currentMonth)
    .single();

  // Get recent events
  const { data: recentEvents, error: eventsError } = await supabaseClient
    .from('gam_events')
    .select('*')
    .eq('usuario_id', usuario_id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get user's rank
  const { data: rankData, error: rankError } = await supabaseClient
    .from('gam_user_monthly')
    .select('usuario_id, pontos')
    .eq('ano', currentYear)
    .eq('mes', currentMonth)
    .order('pontos', { ascending: false });

  let userRank = 0;
  if (rankData) {
    userRank = rankData.findIndex(user => user.usuario_id === usuario_id) + 1;
  }

  return new Response(
    JSON.stringify({
      success: true,
      monthly_data: monthlyData || {
        pontos: 0,
        tier: 'Sem Desconto',
        desconto_percent: 0,
        badges: []
      },
      recent_events: recentEvents || [],
      current_rank: userRank,
      total_users: rankData?.length || 0
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function getLeaderboard(supabaseClient: any) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Get top 10 users this month
  const { data: leaderboard, error } = await supabaseClient
    .from('gam_user_monthly')
    .select(`
      pontos,
      tier,
      badges,
      conectaios_brokers!inner(id, name, avatar_url)
    `)
    .eq('ano', currentYear)
    .eq('mes', currentMonth)
    .order('pontos', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error getting leaderboard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get leaderboard' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      leaderboard: leaderboard || [],
      month: currentMonth,
      year: currentYear
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

serve(handler);