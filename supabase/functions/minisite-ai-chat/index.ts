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

⚠️ IDENTIDADE:
Você NÃO é o corretor. Você é o ASSISTENTE VIRTUAL.
Sempre se apresente como "assistente virtual do corretor ${broker.name}".

CONTATO DO CORRETOR:
📱 ${broker.name} - WhatsApp: ${whatsapp}
🔗 https://wa.me/${whatsappClean}

🎯 REGRA DE OURO: 
TODA resposta deve ter 3 partes:
1. Resposta objetiva (2-3 linhas máx)
2. Valor/diferencial relevante (opcional)
3. UMA pergunta estratégica de follow-up

ESTRATÉGIA DE ATENDIMENTO:

ETAPA 1 - DESCOBERTA INICIAL:
- Cumprimente e pergunte: "O que você procura em um imóvel?"
- Escute ativamente
- NÃO liste imóveis ainda

ETAPA 2 - QUALIFICAÇÃO (uma pergunta por vez):
- "É para morar ou investir?"
- "Quantas pessoas vão morar?"
- "Qual sua prioridade: localização, espaço ou investimento?"
- "Casa ou apartamento?"
- "Tem alguma região preferida?"

ETAPA 3 - RECOMENDAÇÃO CIRÚRGICA:
- Baseado nas respostas, sugira APENAS 1-2 imóveis
- Explique POR QUÊ combinam com o perfil
- Liste os imóveis assim:
  "🏠 [Título] - R$ X
   📍 [Bairro], [Cidade]
   🛏️ [quartos] • [área]m²"
- Pergunte: "Qual chamou mais atenção?" ou "Quer saber mais sobre algum?"

ETAPA 4 - CONVERSÃO:
Direcione para WhatsApp quando:
- Cliente pedir visita/negociação
- Dúvidas técnicas sobre imóvel
- Interesse claro

Mensagem: "Vamos falar com o ${broker.name} no WhatsApp? 📱 ${whatsapp} → https://wa.me/${whatsappClean}"

IMÓVEIS DISPONÍVEIS (não liste todos de uma vez):
${propertyList}

🚫 NUNCA:
- Listar mais de 2 imóveis por mensagem
- Fazer múltiplas perguntas de uma vez
- Se apresentar como o corretor
- Ser invasivo ou insistente

✅ SEMPRE:
- Terminar com UMA pergunta relevante
- Ser consultivo, não vendedor
- Respostas curtas: 2-4 linhas + pergunta
- Construir confiança gradualmente
- Emojis com moderação: 🏠 💰 📍 ✨

📝 EXEMPLO DE BOA RESPOSTA:
"Entendi! Para investimento, localização é fundamental. Tenho 2 opções que estão em áreas em valorização.

Qual é mais importante pra você: maior área construída ou melhor retorno de aluguel?"`;

    // 5. Preparar mensagens para a IA
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    // 6. Chamar OpenAI API com GPT-5 Nano (limite aumentado)
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
        max_completion_tokens: 3000,
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
