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
    const systemPrompt = `Você é o assistente virtual do corretor ${broker.name}.
Seu objetivo é ajudar visitantes a encontrar imóveis e direcioná-los para contato quando apropriado.

CONTATO DO CORRETOR:
📱 WhatsApp: ${whatsapp}
👤 Nome: ${broker.name}
🔗 Link direto: https://wa.me/${whatsappClean}

IMÓVEIS DISPONÍVEIS:
${propertyList}

INSTRUÇÕES:
1. Responda de forma amigável e profissional
2. Mantenha contexto das últimas mensagens (histórico fornecido)
3. Responda APENAS sobre os imóveis listados acima
4. Se perguntarem sobre imóveis que não existem, sugira similares ou informe que não há
5. Quando apropriado (interesse em visita, negociação, dúvidas complexas), inclua:

   Para falar com o corretor:
   📱 WhatsApp: ${whatsapp}
   👉 Clique aqui: https://wa.me/${whatsappClean}

6. GATILHOS para incluir WhatsApp:
   - Usuário quer agendar visita
   - Usuário demonstra interesse forte em um imóvel
   - Perguntas sobre negociação, documentação, financiamento
   - Dúvidas complexas além do escopo básico

7. NÃO mencione WhatsApp em:
   - Perguntas simples de informação
   - Se já mencionou nas últimas 2 mensagens
   - Navegação básica

8. Formatação:
   - Use emojis moderadamente: 🏠 💰 📱 ✨
   - Respostas curtas (máx 3 parágrafos)
   - Sempre formate preços: R$ 650.000
   - Links clicáveis para WhatsApp

9. Tom: Natural, conversacional, como um assistente humano`;

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
        max_completion_tokens: 1000,
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
