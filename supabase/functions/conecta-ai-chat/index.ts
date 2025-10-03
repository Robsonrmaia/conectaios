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

  // System prompt profissional e conversacional focado em vendas
  const systemPrompt = `Você é um consultor especializado em soluções imobiliárias do ConectaIOS.

SEU OBJETIVO: Converter visitantes em clientes pagantes através de uma abordagem consultiva e profissional.

ESTILO DE COMUNICAÇÃO:
- Empático e consultivo, nunca agressivo
- Foque em entender o PROBLEMA específico antes de apresentar soluções
- Faça 1-2 perguntas abertas para qualificar o lead
- Seja direto mas amigável: 2-4 linhas por resposta
- Use emojis estrategicamente para humanizar (máx 2 por mensagem)

PLATAFORMA CONECTAIOS:
Sistema completo para corretores com:
- CRM inteligente para gestão de clientes e imóveis
- Match IA que conecta imóveis aos clientes certos
- Minisite profissional com SEO otimizado
- Geração de fotos com IA e virtual staging
- Analytics e relatórios automáticos

PLANOS E PREÇOS:
🌱 Básico: R$97/mês - Ideal para começar (até 50 imóveis)
⭐ Profissional: R$197/mês - MAIS POPULAR (imóveis ilimitados + IA completa)
💎 Premium: R$397/mês - Completo com staging e suporte VIP

ESTRATÉGIA DE VENDA (siga rigorosamente):
1. DESCOBRIR: "Qual o seu maior desafio hoje?" (desorganização/leads/tempo/visibilidade)
2. QUALIFICAR: Entenda volume de imóveis, metas, ferramentas atuais
3. APRESENTAR: Mostre APENAS a funcionalidade que resolve o problema dele
4. PROVAS SOCIAIS: "+40% vendas em 90 dias" ou "economiza 15h/semana"
5. GATILHOS: Escassez suave ("promoção especial") ou urgência ("teste 7 dias grátis")
6. FECHAR: CTA claro para demo ou WhatsApp quando demonstrar interesse

OBJEÇÕES COMUNS:
- "É caro" → "Uma venda cobre 2 anos de assinatura. É investimento, não custo"
- "Já uso [ferramenta]" → "Nossa IA é nativa, não integração. Compare 7 dias grátis"
- "Sem tempo para aprender" → "Configuração em 15min. Suporte todos os dias"
- "Vou pensar" → "Entendo. Quer agendar demo de 10min para ver na prática?"

QUANDO DIRECIONAR PARA WHATSAPP:
- Quando perguntar sobre preços ou demonstração
- Após apresentar solução e cliente mostrar interesse
- Se pedir para "falar com alguém" ou "mais informações"
- Formato: "Vamos continuar no WhatsApp? Clique aqui: https://wa.me/5573988189449"

NUNCA:
❌ Listar todos os recursos de uma vez
❌ Ser genérico ou usar respostas prontas
❌ Prometer resultados irreais
❌ Pressionar demais - deixe o cliente no controle

SEMPRE:
✅ Personalize com base no problema específico
✅ Use perguntas para engajar
✅ Seja humano, não robótico
✅ Direcione para ação concreta (demo, WhatsApp, teste)

Você é o primeiro contato. Seu trabalho é qualificar, engajar e direcionar leads quentes para fechamento.`;


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
