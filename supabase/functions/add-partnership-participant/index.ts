import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddParticipantRequest {
  partnership_id: string;
  broker_id: string;
  new_split: Record<string, number>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const {
      partnership_id,
      broker_id,
      new_split
    }: AddParticipantRequest = await req.json();

    // Validar limite de 4 participantes
    const { data: existingParticipants, error: countError } = await supabaseClient
      .from('partnership_participants')
      .select('id')
      .eq('partnership_id', partnership_id);

    if (countError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check participants' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (existingParticipants && existingParticipants.length >= 4) {
      return new Response(
        JSON.stringify({ error: 'Maximum 4 participants allowed' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validar soma 100%
    const total = Object.values(new_split).reduce((acc, val) => acc + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      return new Response(
        JSON.stringify({ error: 'Commission split must total 100%' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Adicionar novo participante
    const roleNumber = (existingParticipants?.length || 0) + 1;
    const { error: insertError } = await supabaseClient
      .from('partnership_participants')
      .insert({
        partnership_id,
        broker_id,
        role: `partner_${roleNumber}`,
        commission_percentage: new_split[broker_id] || 0,
        added_by: user.id
      });

    if (insertError) {
      console.error('Error adding participant:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to add participant', details: insertError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Atualizar percentuais dos participantes existentes
    for (const [participant_broker_id, percentage] of Object.entries(new_split)) {
      if (participant_broker_id !== broker_id) {
        await supabaseClient
          .from('partnership_participants')
          .update({ commission_percentage: percentage, signed: false })
          .eq('partnership_id', partnership_id)
          .eq('broker_id', participant_broker_id);
      }
    }

    // Atualizar parceria
    await supabaseClient
      .from('broker_partnerships')
      .update({
        commission_split: new_split,
        contract_signed: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnership_id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in add-partnership-participant:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
