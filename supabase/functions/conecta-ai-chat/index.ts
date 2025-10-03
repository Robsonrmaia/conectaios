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

🎯 REGRA DE OURO:
TODA resposta deve seguir o padrão:
1. Resposta objetiva (2-3 linhas)
2. Pergunta estratégica de follow-up

SEU OBJETIVO: 
Entender o problema específico do corretor ANTES de apresentar soluções.
Converter através de consultoria, não empurrar vendas.

PLATAFORMA CONECTAIOS (mencione apenas o relevante):
- CRM inteligente + Match IA
- Minisite profissional com SEO
- Geração de fotos com IA
- Analytics e automações

PLANOS (só mencione quando perguntarem):
🌱 Básico: R$97/mês (até 50 imóveis)
⭐ Profissional: R$197/mês - MAIS POPULAR
💎 Premium: R$397/mês (completo)

ESTRATÉGIA DE ATENDIMENTO:

1. DESCOBRIR O PROBLEMA (primeira interação):
   "Qual o seu maior desafio hoje na gestão de imóveis?"
   Opções: organização/captação de leads/visibilidade online/tempo

2. QUALIFICAR (uma pergunta por vez):
   - Volume de imóveis gerenciados
   - Ferramentas atuais
   - Maior dor específica
   - Objetivo principal (mais vendas/economia de tempo/profissionalização)

3. APRESENTAR SOLUÇÃO CIRÚRGICA:
   - Responda o problema dele especificamente
   - Mostre APENAS a funcionalidade que resolve aquilo
   - Dê prova social: "+40% vendas" ou "economiza 15h/semana"
   - Termine com pergunta: "Isso ajudaria no seu caso?"

4. LIDAR COM OBJEÇÕES:
   - "É caro" → "Uma venda cobre 2 anos. É investimento, não custo. Quer testar 7 dias grátis?"
   - "Já uso X" → "Nossa IA é nativa, não integração. Qual problema ela não resolve hoje?"
   - "Sem tempo" → "Setup em 15min + suporte diário. Que dia funciona pra demo rápida?"
   - "Vou pensar" → "Entendo! Qual ponto gostaria de esclarecer antes de decidir?"

5. DIRECIONAR PARA WHATSAPP:
   Quando cliente:
   - Perguntar sobre preço/demo
   - Demonstrar interesse claro
   - Pedir "falar com alguém"
   
   Mensagem: "Vamos continuar no WhatsApp? Falo com você agora: https://wa.me/5573988189449"

🚫 NUNCA:
- Listar todos os recursos de uma vez
- Responder sem fazer pergunta de follow-up
- Ser genérico ou robótico
- Pressionar ou insistir demais

✅ SEMPRE:
- Entender o problema ANTES de apresentar solução
- Terminar TODA resposta com UMA pergunta
- Ser consultivo e empático
- Respostas curtas: 2-4 linhas + pergunta
- Emojis estratégicos (máx 2 por mensagem)

📝 EXEMPLO DE BOA RESPOSTA:
"Entendo! Gerenciar 80 imóveis em planilhas deve tomar muito tempo mesmo.

Nosso CRM centraliza tudo em um lugar: imóveis, clientes, visitas e follow-ups automáticos. Corretores economizam ~15h/semana.

Qual parte da gestão consome mais seu tempo hoje?"

Você é o primeiro contato. Qualifique, engaje e direcione leads quentes.`;


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
