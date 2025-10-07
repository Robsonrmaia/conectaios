import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePartnershipRequest {
  property_id: string;
  target_broker_id: string;
  proposed_split: Record<string, number>;
  message?: string;
  expires_in_days?: number;
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
      property_id,
      target_broker_id,
      proposed_split,
      message,
      expires_in_days = 7
    }: CreatePartnershipRequest = await req.json();

    // Validar que a soma é 100%
    const total = Object.values(proposed_split).reduce((acc, val) => acc + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      return new Response(
        JSON.stringify({ error: 'Commission split must total 100%' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verificar propriedade do imóvel
    const { data: property, error: propertyError } = await supabaseClient
      .from('imoveis')
      .select('id, owner_id')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Criar parceria
    const { data: partnership, error: partnershipError } = await supabaseClient
      .from('broker_partnerships')
      .insert({
        property_id,
        property_owner_id: property.owner_id,
        initiated_by: user.id,
        commission_split: proposed_split,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (partnershipError) {
      console.error('Error creating partnership:', partnershipError);
      return new Response(
        JSON.stringify({ error: 'Failed to create partnership', details: partnershipError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Adicionar participantes
    const participants = [];
    let role = 0;
    for (const [broker_id, percentage] of Object.entries(proposed_split)) {
      const participantRole = broker_id === property.owner_id ? 'owner' : `partner_${role + 1}`;
      if (broker_id !== property.owner_id) role++;
      
      participants.push({
        partnership_id: partnership.id,
        broker_id,
        role: participantRole,
        commission_percentage: percentage,
        added_by: user.id
      });
    }

    const { error: participantsError } = await supabaseClient
      .from('partnership_participants')
      .insert(participants);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      return new Response(
        JSON.stringify({ error: 'Failed to add participants', details: participantsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Criar proposta inicial
    const { error: proposalError } = await supabaseClient
      .from('partnership_proposals')
      .insert({
        partnership_id: partnership.id,
        proposed_by: user.id,
        proposed_split,
        message,
        status: 'pending'
      });

    if (proposalError) {
      console.error('Error creating proposal:', proposalError);
    }

    return new Response(
      JSON.stringify({ partnership, success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in create-partnership:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
