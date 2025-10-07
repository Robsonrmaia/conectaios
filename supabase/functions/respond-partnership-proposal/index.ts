import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RespondProposalRequest {
  proposal_id: string;
  action: 'accept' | 'reject' | 'counter';
  counter_split?: Record<string, number>;
  message?: string;
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
      proposal_id,
      action,
      counter_split,
      message
    }: RespondProposalRequest = await req.json();

    // Buscar proposta
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('partnership_proposals')
      .select('*, partnership:broker_partnerships(*)')
      .eq('id', proposal_id)
      .single();

    if (proposalError || !proposal) {
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (action === 'accept') {
      // Atualizar proposta
      await supabaseClient
        .from('partnership_proposals')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', proposal_id);

      // Atualizar parceria com a divisão acordada
      await supabaseClient
        .from('broker_partnerships')
        .update({
          commission_split: proposal.proposed_split,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.partnership_id);

      // Atualizar participantes com novos percentuais
      for (const [broker_id, percentage] of Object.entries(proposal.proposed_split as Record<string, number>)) {
        await supabaseClient
          .from('partnership_participants')
          .update({ commission_percentage: percentage })
          .eq('partnership_id', proposal.partnership_id)
          .eq('broker_id', broker_id);
      }

    } else if (action === 'reject') {
      await supabaseClient
        .from('partnership_proposals')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', proposal_id);

      await supabaseClient
        .from('broker_partnerships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', proposal.partnership_id);

    } else if (action === 'counter' && counter_split) {
      // Validar que soma é 100%
      const total = Object.values(counter_split).reduce((acc, val) => acc + val, 0);
      if (Math.abs(total - 100) > 0.01) {
        return new Response(
          JSON.stringify({ error: 'Commission split must total 100%' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Marcar proposta anterior como supersedida
      await supabaseClient
        .from('partnership_proposals')
        .update({ status: 'superseded' })
        .eq('id', proposal_id);

      // Criar nova contraproposta
      await supabaseClient
        .from('partnership_proposals')
        .insert({
          partnership_id: proposal.partnership_id,
          proposed_by: user.id,
          proposed_split: counter_split,
          message,
          status: 'pending'
        });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in respond-partnership-proposal:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
