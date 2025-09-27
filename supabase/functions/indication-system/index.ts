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
    .from('conectaios_brokers')
    .select('id, name, user_id')
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
    .eq('id_indicado', body.indicated_broker_id)
    .in('status', ['pendente', 'confirmado'])
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
      id_indicador: indicador.id,
      id_indicado: body.indicated_broker_id,
      codigo_indicacao: body.referral_code,
      mes_recompensa: mesRecompensa,
      status: 'pendente'
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

  // Calcular desconto do indicado (50% no primeiro mês)
  const { data: planData } = await supabaseClient
    .from('conectaios_brokers')
    .select('plan_id, conectaios_plans!inner(monthly_price)')
    .eq('id', body.indicated_broker_id)
    .single();

  const planValue = planData?.conectaios_plans?.monthly_price || 97.00;
  const discount = planValue * 0.5;

  // Registrar desconto do indicado
  await supabaseClient
    .from('indication_discounts')
    .insert({
      broker_id: body.indicated_broker_id,
      mes_aplicacao: parseInt(new Date().toISOString().slice(0, 7).replace('-', '')),
      tipo_desconto: 'indicado_50',
      valor_original: planValue,
      valor_desconto: discount,
      valor_final: planValue - discount,
      indicacoes_relacionadas: [indication.id]
    });

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
      status: 'confirmado',
      data_confirmacao: new Date().toISOString()
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
    .order('data_criacao', { ascending: false });

  if (body.broker_id) {
    query = query.or(`id_indicador.eq.${body.broker_id},id_indicado.eq.${body.broker_id}`);
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
    // Buscar dados do indicador
    const { data: indicador } = await supabaseClient
      .from('conectaios_brokers')
      .select('id, name, username')
      .eq('id', indication.id_indicador)
      .single();

    // Buscar dados do indicado  
    const { data: indicado } = await supabaseClient
      .from('conectaios_brokers')
      .select('id, name, username, email')
      .eq('id', indication.id_indicado)
      .single();

    enrichedIndications.push({
      ...indication,
      indicador,
      indicado
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