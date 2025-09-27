import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QueryContext {
  properties?: any[];
  clients?: any[];
  deals?: any[];
  tasks?: any[];
  notes?: any[];
}

async function getBrokerData(userId: string) {
  const { data: broker } = await supabase
    .from('conectaios_brokers')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return broker;
}

async function getRelevantData(query: string, userId: string): Promise<QueryContext> {
  const context: QueryContext = {};
  const queryLower = query.toLowerCase();
  
  // Buscar propriedades se pergunta sobre imóveis, vendas, preços, etc.
  if (queryLower.includes('imóv') || queryLower.includes('propriedade') || 
      queryLower.includes('venda') || queryLower.includes('preço') || 
      queryLower.includes('valor') || queryLower.includes('apartamento') ||
      queryLower.includes('casa')) {
    
    const { data: properties } = await supabase
      .from('conectaios_properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    context.properties = properties;
  }
  
  // Buscar clientes se pergunta sobre leads, clientes, contatos
  if (queryLower.includes('client') || queryLower.includes('lead') || 
      queryLower.includes('contato') || queryLower.includes('pessoa') ||
      queryLower.includes('comprador')) {
    
    const { data: clients } = await supabase
      .from('conectaios_clients')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);
    
    context.clients = clients;
  }
  
  // Buscar deals se pergunta sobre negócios, propostas, vendas
  if (queryLower.includes('deal') || queryLower.includes('negócio') || 
      queryLower.includes('proposta') || queryLower.includes('venda') ||
      queryLower.includes('comissão')) {
    
    const { data: deals } = await supabase
      .from('deals')
      .select(`
        *,
        properties!deals_property_id_fkey (titulo, valor),
        conectaios_clients!deals_client_id_fkey (nome, telefone)
      `)
      .or(`buyer_broker_id.in.(${userId}),seller_broker_id.in.(${userId}),listing_broker_id.in.(${userId})`)
      .order('created_at', { ascending: false })
      .limit(5);
    
    context.deals = deals;
  }
  
  // Buscar tarefas se pergunta sobre tarefas, agenda, fazer
  if (queryLower.includes('tarefa') || queryLower.includes('fazer') || 
      queryLower.includes('agenda') || queryLower.includes('pendente') ||
      queryLower.includes('hoje')) {
    
    const { data: tasks } = await supabase
      .from('conectaios_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    context.tasks = tasks;
  }
  
  // Buscar notas se pergunta sobre notas, anotações, observações
  if (queryLower.includes('nota') || queryLower.includes('anotação') || 
      queryLower.includes('observação') || queryLower.includes('lembr')) {
    
    const { data: notes } = await supabase
      .from('conectaios_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    context.notes = notes;
  }
  
  return context;
}

function buildContextPrompt(context: QueryContext, broker: any): string {
  let prompt = `Você é o assistente IA pessoal do corretor ${broker?.name || 'usuário'}. Use os dados abaixo para responder de forma útil e específica:\n\n`;
  
  if (context.properties?.length) {
    prompt += `PROPRIEDADES (${context.properties.length}):\n`;
    context.properties.forEach(prop => {
      prompt += `- ${prop.titulo}: R$ ${prop.valor?.toLocaleString('pt-BR') || 'N/A'}, ${prop.area}m², ${prop.quartos} quartos (${prop.property_type})\n`;
    });
    prompt += '\n';
  }
  
  if (context.clients?.length) {
    prompt += `CLIENTES (${context.clients.length}):\n`;
    context.clients.forEach(client => {
      prompt += `- ${client.nome}: ${client.telefone}, Stage: ${client.stage}, Classificação: ${client.classificacao}\n`;
    });
    prompt += '\n';
  }
  
  if (context.deals?.length) {
    prompt += `NEGÓCIOS (${context.deals.length}):\n`;
    context.deals.forEach(deal => {
      prompt += `- Status: ${deal.status}, Valor: R$ ${deal.offer_amount?.toLocaleString('pt-BR') || 'N/A'}\n`;
    });
    prompt += '\n';
  }
  
  if (context.tasks?.length) {
    prompt += `TAREFAS (${context.tasks.length}):\n`;
    context.tasks.forEach(task => {
      prompt += `- ${task.txt} (${task.done ? 'Concluída' : 'Pendente'})\n`;
    });
    prompt += '\n';
  }
  
  if (context.notes?.length) {
    prompt += `NOTAS (${context.notes.length}):\n`;
    context.notes.forEach(note => {
      prompt += `- ${note.content.substring(0, 100)}...\n`;
    });
    prompt += '\n';
  }
  
  prompt += `Responda em português, seja específico usando os dados acima, e mantenha um tom profissional mas amigável. Se não houver dados relevantes, explique que precisa de mais informações ou sugira próximos passos.`;
  
  return prompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    console.log(`Processing AI request for user: ${userId}, message: ${message}`);

    // Buscar dados do broker
    const broker = await getBrokerData(userId);
    
    // Buscar dados relevantes baseado na pergunta
    const context = await getRelevantData(message, userId);
    
    // Construir prompt com contexto
    const systemPrompt = buildContextPrompt(context, broker);
    
    console.log('Context built:', { 
      properties: context.properties?.length || 0,
      clients: context.clients?.length || 0,
      deals: context.deals?.length || 0,
      tasks: context.tasks?.length || 0,
      notes: context.notes?.length || 0
    });

    // Chamar OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: {
        propertiesCount: context.properties?.length || 0,
        clientsCount: context.clients?.length || 0,
        dealsCount: context.deals?.length || 0,
        tasksCount: context.tasks?.length || 0,
        notesCount: context.notes?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});