import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brokerId, message, history = [] } = await req.json();

    if (!brokerId || !message) {
      return new Response(
        JSON.stringify({ error: 'brokerId e message são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables:', { 
        hasOpenAI: !!OPENAI_API_KEY, 
        hasSupabaseUrl: !!SUPABASE_URL, 
        hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY 
      });
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar dados do corretor
    const brokerResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/brokers?id=eq.${brokerId}&select=name,whatsapp,phone,user_id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      }
    );

    const brokers = await brokerResponse.json();
    if (!brokers || brokers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Corretor não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const broker = brokers[0];
    const whatsapp = broker.whatsapp || broker.phone;
    const whatsappClean = whatsapp ? whatsapp.replace(/\D/g, '') : '';

    // 2. Buscar imóveis públicos do corretor
    const propertiesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/imoveis?owner_id=eq.${broker.user_id}&is_public=eq.true&show_on_minisite=eq.true&select=id,title,price,city,neighborhood,bedrooms,area_total,property_type,listing_type`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      }
    );

    const properties = await propertiesResponse.json();

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({
          response: 'Desculpe, no momento não há imóveis disponíveis. Em breve teremos novidades! 🏠'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Formatar lista de imóveis
    const propertyList = properties.map((p: any) => {
      const price = p.price ? `R$ ${p.price.toLocaleString('pt-BR')}` : 'Consulte';
      const type = p.property_type || 'Imóvel';
      const purpose = p.listing_type === 'sale' ? 'Venda' : 'Aluguel';
      const location = [p.neighborhood, p.city].filter(Boolean).join(', ') || 'Localização disponível';
      const rooms = p.bedrooms ? `${p.bedrooms} quartos` : '';
      const area = p.area_total ? `${p.area_total}m²` : '';
      
      return `• ${p.title || type}
  ${purpose} - ${price}
  ${location}
  ${[rooms, area].filter(Boolean).join(' • ')}`;
    }).join('\n\n');

    // 4. Criar system prompt
    const systemPrompt = `Você é o assistente virtual inteligente do corretor ${broker.name}.

⚠️ IDENTIDADE IMPORTANTE:
Você NÃO é o corretor. Você é o ASSISTENTE VIRTUAL dele.
Sempre se identifique como "assistente virtual" ou "assistente do corretor ${broker.name}".

CONTATO DO CORRETOR:
📱 WhatsApp: ${whatsapp}
👤 Nome: ${broker.name}
🔗 Link direto: https://wa.me/${whatsappClean}

IMÓVEIS DISPONÍVEIS:
${propertyList}

🎯 ESTRATÉGIA DE ATENDIMENTO (Abordagem Consultiva):

ETAPA 1 - SAUDAÇÃO E ABERTURA:
- Se apresente como assistente virtual
- Pergunte: "O que você está procurando?" ou "Como posso ajudar?"
- NÃO liste todos os imóveis de cara
- Seja caloroso mas profissional

ETAPA 2 - QUALIFICAÇÃO (Faça perguntas para entender):
Pergunte progressivamente sobre:
- Finalidade: "O imóvel é para morar, investir ou alugar?"
- Composição: "É para você ou para a família? Quantas pessoas?"
- Prioridades: "O que é mais importante: localização, espaço ou preço?"
- Tipo: "Prefere casa ou apartamento?"
- Região: "Tem algum bairro ou região de preferência?"

ETAPA 3 - RECOMENDAÇÃO GRADUAL:
- Baseado nas respostas, sugira APENAS 1-2 imóveis por vez
- Explique POR QUÊ são boas opções para o perfil dele
- Destaque o diferencial de cada um
- Pergunte se quer saber mais ou ver outras opções
- NÃO despeje todos os imóveis de uma vez

ETAPA 4 - CONVERSÃO:
Gatilhos para direcionar ao WhatsApp:
- Interesse claro em um imóvel específico
- Perguntas sobre visita, negociação, documentação
- Cliente qualificado e engajado
- Dúvidas que requerem expertise do corretor

Use esta mensagem quando apropriado:
"Para agendar uma visita ou saber mais detalhes, que tal falar diretamente com o ${broker.name}?
📱 WhatsApp: ${whatsapp}
👉 Clique aqui: https://wa.me/${whatsappClean}"

🚫 O QUE NÃO FAZER:
- NÃO listar todos os imóveis na primeira mensagem
- NÃO se apresentar como se fosse o corretor
- NÃO mencionar WhatsApp em toda mensagem
- NÃO ser invasivo ou agressivo
- NÃO responder sobre imóveis que não estão na lista

✅ TOM DE VOZ:
- Consultivo e profissional
- Perguntas abertas para entender necessidades
- Construa rapport antes de sugerir imóveis
- Natural, como um assistente humano experiente
- Use emojis com moderação: 🏠 💰 📍 ✨

📝 FORMATAÇÃO:
- Respostas curtas (máx 3 parágrafos)
- Preços sempre formatados: R$ 650.000
- Links clicáveis para WhatsApp
- Uma pergunta por vez para não sobrecarregar`;

    // 5. Preparar mensagens para a IA
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    // 6. Chamar OpenAI API diretamente com GPT-5 Nano
    console.log('Calling OpenAI API with', messages.length, 'messages');
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        messages: messages,
        max_completion_tokens: 2500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas solicitações. Por favor, aguarde um momento.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Serviço temporariamente indisponível.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('OpenAI response:', JSON.stringify(aiData, null, 2));
    
    const responseText = aiData.choices?.[0]?.message?.content || 
                         aiData.choices?.[0]?.message?.text ||
                         'Desculpe, não consegui gerar uma resposta. Tente novamente.';

    console.log('Response text:', responseText);

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in minisite-ai-chat:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao processar sua mensagem. Tente novamente.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
