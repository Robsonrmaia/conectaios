import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateIndicationRequest {
  action: 'create';
  referral_code: string;
  indicated_broker_id: string;
  indicated_email?: string;
  indicated_phone?: string;
}

interface ConfirmIndicationRequest {
  action: 'confirm';
  indication_id: string;
}

interface GetIndicationsRequest {
  action: 'get';
  broker_id?: string;
}

interface ProcessRewardsRequest {
  action: 'process_rewards';
  target_month?: number;
}

type IndicationRequest = CreateIndicationRequest | ConfirmIndicationRequest | GetIndicationsRequest | ProcessRewardsRequest;

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

    const body: IndicationRequest = await req.json();
    console.log('Indication system request:', body);

    switch (body.action) {
      case 'create':
        return await createIndication(supabaseClient, body);
      case 'confirm':
        return await confirmIndication(supabaseClient, body);
      case 'get':
        return await getIndications(supabaseClient, body);
      case 'process_rewards':
        return await processRewards(supabaseClient, body);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
  } catch (error) {
    console.error('Error in indication system:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

async function createIndication(supabaseClient: any, body: CreateIndicationRequest) {
  console.log('Creating indication for referral code:', body.referral_code);

  // Buscar corretor indicador pelo código
  const { data: indicador, error: indicadorError } = await supabaseClient
    .from('brokers')
    .select('id, user_id')
    .eq('referral_code', body.referral_code)
    .single();

  if (indicadorError || !indicador) {
    return new Response(
      JSON.stringify({ error: 'Código de indicação inválido' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Verificar se já existe indicação para este corretor indicado
  const { data: existingIndication } = await supabaseClient
    .from('indications')
    .select('id')
    .eq('referred_id', body.indicated_broker_id)
    .in('status', ['pending', 'confirmed'])
    .single();

  if (existingIndication) {
    return new Response(
      JSON.stringify({ error: 'Este corretor já foi indicado anteriormente' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Criar indicação
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const mesRecompensa = parseInt(nextMonth.toISOString().slice(0, 7).replace('-', ''));

  const { data: indication, error: indicationError } = await supabaseClient
    .from('indications')
    .insert({
      referrer_id: indicador.user_id,
      referred_id: body.indicated_broker_id,
      referred_email: body.indicated_email,
      referred_phone: body.indicated_phone,
      status: 'pending',
      reward_amount: 50.0
    })
    .select()
    .single();

  if (indicationError) {
    console.error('Error creating indication:', indicationError);
    return new Response(
      JSON.stringify({ error: 'Erro ao criar indicação' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Remover linhas não utilizadas na correção
  const { data: planData } = await supabaseClient
    .from('subscriptions')
    .select('plan')
    .eq('profile_id', body.indicated_broker_id)
    .single();

  // Usar valor padrão se não encontrar plano
  const planValue = 97.00;
  const discount = planValue * 0.5;

  console.log('Indication created successfully:', indication.id);

  return new Response(
    JSON.stringify({
      success: true,
      indication,
      discount_applied: discount,
      message: 'Indicação criada com sucesso! Desconto de 50% aplicado no primeiro mês.'
    }),
    { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function confirmIndication(supabaseClient: any, body: ConfirmIndicationRequest) {
  console.log('Confirming indication:', body.indication_id);

  // Atualizar status da indicação
  const { data: indication, error: updateError } = await supabaseClient
    .from('indications')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', body.indication_id)
    .select()
    .single();

  if (updateError) {
    console.error('Error confirming indication:', updateError);
    return new Response(
      JSON.stringify({ error: 'Erro ao confirmar indicação' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  console.log('Indication confirmed successfully');

  return new Response(
    JSON.stringify({
      success: true,
      indication,
      message: 'Indicação confirmada com sucesso!'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function getIndications(supabaseClient: any, body: GetIndicationsRequest) {
  let query = supabaseClient
    .from('indications')
    .select('*')
    .order('created_at', { ascending: false });

  if (body.broker_id) {
    query = query.or(`referrer_id.eq.${body.broker_id},referred_id.eq.${body.broker_id}`);
  }

  const { data: indications, error } = await query;

  if (error) {
    console.error('Error fetching indications:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar indicações' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Buscar dados dos corretores separadamente
  const enrichedIndications = [];
  
  for (const indication of indications || []) {
    // Buscar dados do indicador pelo user_id
    const { data: indicadorProfile } = await supabaseClient
      .from('profiles')
      .select('id, name, email')
      .eq('id', indication.referrer_id)
      .single();

    // Buscar dados do indicado pelo user_id
    const { data: indicadoProfile } = await supabaseClient
      .from('profiles')
      .select('id, name, email')
      .eq('id', indication.referred_id)
      .single();

    enrichedIndications.push({
      ...indication,
      indicador: indicadorProfile,
      indicado: indicadoProfile
    });
  }

  // Buscar descontos aplicados
  const { data: discounts } = await supabaseClient
    .from('indication_discounts')
    .select('*')
    .eq('broker_id', body.broker_id || '');

  return new Response(
    JSON.stringify({
      success: true,
      indications: enrichedIndications,
      discounts: discounts || []
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

async function processRewards(supabaseClient: any, body: ProcessRewardsRequest) {
  console.log('Processing monthly rewards');

  const { data, error } = await supabaseClient
    .rpc('process_monthly_indication_rewards', {
      target_month: body.target_month
    });

  if (error) {
    console.error('Error processing rewards:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar recompensas' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      result: data,
      message: 'Recompensas processadas com sucesso!'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

serve(handler);