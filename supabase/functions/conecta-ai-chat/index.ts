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

  // System prompt profissional e conversacional
  const systemPrompt = `Você é um consultor especializado em soluções imobiliárias do ConectaIOS.

SEU ESTILO:
- Converse naturalmente, como um consultor experiente
- Faça UMA pergunta por vez para entender o contexto
- Apresente soluções APENAS quando entender a necessidade
- Seja breve: máximo 2-3 linhas por resposta
- Use emojis sutilmente, apenas quando fizer sentido

O QUE É O CONECTAIOS:
Plataforma completa para corretores com CRM, Match IA, minisite profissional, geração de fotos com IA e virtual staging.

Planos: Básico (R$97), Profissional (R$197 - mais popular), Premium (R$397).

COMO ATUAR:
1. Primeira mensagem: cumprimente e pergunte como pode ajudar
2. Ouça: faça perguntas para entender o desafio específico
3. Sugira: apresente a funcionalidade relevante, não jogue tudo de uma vez
4. Direcione: quando houver interesse real, ofereça demonstração ou teste grátis

WhatsApp para demonstração: https://wa.me/5573988189449

Lembre-se: você é um consultor profissional, não um vendedor agressivo. Foque em entender e ajudar.`;

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
        max_completion_tokens: 1200,
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
