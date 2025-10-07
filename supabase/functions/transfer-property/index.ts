import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Não autenticado');
    }

    // Verificar se usuário é admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Acesso negado: apenas administradores podem transferir propriedades');
    }

    const { property_id, to_broker_id, reason, support_ticket_id } = await req.json();

    if (!property_id || !to_broker_id) {
      throw new Error('property_id e to_broker_id são obrigatórios');
    }

    // Buscar propriedade atual
    const { data: property, error: propError } = await supabaseClient
      .from('imoveis')
      .select('id, owner_id, title, reference_code')
      .eq('id', property_id)
      .single();

    if (propError || !property) {
      throw new Error('Propriedade não encontrada');
    }

    // Verificar se corretor destino existe e está ativo
    const { data: toBroker, error: brokerError } = await supabaseClient
      .from('brokers')
      .select('id, user_id, name, status')
      .eq('user_id', to_broker_id)
      .single();

    if (brokerError || !toBroker) {
      throw new Error('Corretor destino não encontrado');
    }

    if (toBroker.status !== 'active') {
      throw new Error('Corretor destino não está ativo');
    }

    const from_broker_id = property.owner_id;

    // Executar transferência
    const { error: updateError } = await supabaseClient
      .from('imoveis')
      .update({ owner_id: to_broker_id, updated_at: new Date().toISOString() })
      .eq('id', property_id);

    if (updateError) {
      throw new Error(`Erro ao transferir propriedade: ${updateError.message}`);
    }

    // Registrar histórico de transferência
    const { error: transferError } = await supabaseClient
      .from('property_transfers')
      .insert({
        property_id,
        from_broker_id,
        to_broker_id,
        transferred_by: user.id,
        reason,
        support_ticket_id
      });

    if (transferError) {
      console.error('Erro ao registrar transferência:', transferError);
    }

    // Registrar em audit_log
    const { error: auditError } = await supabaseClient.rpc('log_audit_event', {
      _action: 'transfer_property',
      _resource_type: 'imoveis',
      _resource_id: property_id,
      _old_values: { owner_id: from_broker_id },
      _new_values: { owner_id: to_broker_id, reason }
    });

    if (auditError) {
      console.error('Erro ao registrar auditoria:', auditError);
    }

    console.log(`Propriedade ${property.reference_code} transferida de ${from_broker_id} para ${to_broker_id} por ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Propriedade transferida com sucesso',
        transfer: {
          property_id,
          property_title: property.title,
          from_broker_id,
          to_broker_id,
          transferred_by: user.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na transferência:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
