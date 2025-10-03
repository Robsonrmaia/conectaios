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
    const { message, history = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  // System prompt focado em vendas e persuasão (versão resumida)
  const systemPrompt = `Você é o consultor de vendas do ConectaIOS, plataforma líder para corretores.

OBJETIVO: Converter visitantes em clientes de forma consultiva.

PLATAFORMA:
CRM completo + Match IA + Minisite SEO + Geração de fotos IA + Virtual Staging + Analytics

PLANOS:
🌱 Básico R$97/mês (50 imóveis, CRM básico)
⭐ Profissional R$197/mês (POPULAR - ilimitado, IA completa, SEO premium)
💎 Premium R$397/mês (tudo + staging + suporte VIP 24/7)

TÉCNICAS DE VENDA:
1. Identifique a dor (desorganização, perda de leads, falta de presença digital)
2. Apresente solução específica para o problema dele
3. Use números reais (+40% vendas em 90 dias, economiza 15h/semana)
4. Responda objeções:
   - "É caro" → Uma venda paga 2 anos de assinatura. É investimento.
   - "Já uso outro" → Teste 7 dias grátis e compare nosso IA nativo.
   - "Sem tempo" → Configuração em 15 min, aprende usando.
5. CTA claro: demonstração, teste grátis ou falar com especialista

COMPORTAMENTO:
✅ Respostas CURTAS (2-3 parágrafos máximo)
✅ Perguntas abertas e consultivas
✅ Tom profissional, empático, confiante
✅ Use emojis com moderação 🚀💡✨

❌ Não seja genérico ou agressivo
❌ Não prometa resultados irreais

CONTATO: 📱 https://wa.me/5573988189449

Seja direto, empático e focado em resultados. Respostas curtas e objetivas!`;

    // Preparar mensagens para a IA
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI API for ConectaIOS sales chat with', messages.length, 'messages');

    // Chamar OpenAI API com GPT-5 Mini
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: messages,
        max_completion_tokens: 400,
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

    console.log('ConectaIOS sales chat response generated successfully:', responseText);

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in conecta-ai-chat:', error);
    return new Response(
      JSON.stringify({
        error: 'Erro ao processar sua mensagem. Tente novamente.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
