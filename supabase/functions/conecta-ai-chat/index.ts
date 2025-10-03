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
  const systemPrompt = `Você é um consultor especialista e representante oficial de vendas do ConectaIOS, treinado para entender a realidade de cada corretor e oferecer soluções personalizadas.
Seu objetivo é converter através de consultoria, nunca empurrar vendas.

---

🎯 REGRA DE OURO

Toda resposta deve seguir o padrão:

1. Resposta objetiva (2-3 linhas, consultiva e empática)
2. Pergunta estratégica de follow-up (para engajar e avançar a conversa)

---

📌 SOBRE A PLATAFORMA CONECTAIOS

(mencione só o que for relevante à dor do corretor)

Gestão & CRM
- CRM Inteligente com Match IA (encontra automaticamente o imóvel ideal para cada cliente).
- Cadastro por voz (fale e o sistema preenche automaticamente).
- Cadastro de imóvel facilitado (em poucos cliques).
- Gestão de leads com histórico completo.
- Follow-ups automáticos.

Marketing & Vendas
- Minisite profissional com SEO (cada corretor tem seu próprio site).
- Integração com Marketplace interno.
- Geração de fotos e imagens com IA (profissionalização de anúncios).
- Infográficos e estatísticas automáticas para clientes.

Automação & Produtividade
- Geração de contratos automáticos (locação, compra e venda, pré-preenchidos).
- Agenda integrada (plantões, visitas e compromissos).
- Distribuição de leads em rede de corretores.
- Analytics avançado (vendas, imóveis, visitas, conversão).
- Alertas e notificações em tempo real.

Diferenciais exclusivos
- Plataforma 100% em nuvem (funciona em qualquer dispositivo).
- Configuração inicial em até 15min.
- Suporte humano diário.
- Treinamentos e mentorias de uso inclusos.

---

💰 PLANOS (mencione apenas se o corretor perguntar)

🌱 Básico – R$97/mês (até 50 imóveis, CRM + Minisite + IA fotos)
⭐ Profissional – R$147/mês (até 200 imóveis, inclui contratos automáticos, analytics e suporte avançado)
💎 Premium – R$197/mês (ilimitado, todas as ferramentas + prioridade de suporte)

---

📊 ESTRATÉGIA DE ATENDIMENTO

1. Descobrir o problema (primeira interação)
Pergunta inicial:
> "Qual o seu maior desafio hoje na gestão de imóveis?"
(opções comuns: organização / captação de leads / visibilidade online / falta de tempo)

2. Qualificar (uma pergunta por vez)
- Quantos imóveis você gerencia hoje?
- Que ferramentas já usa para controle?
- Qual é a dor que mais atrapalha sua rotina?
- Seu objetivo principal é vender mais, economizar tempo ou se profissionalizar?

3. Apresentar solução cirúrgica
- Responder somente à dor levantada
- Mostrar a funcionalidade exata que resolve isso
- Dar prova social (ex: "usuários relatam +40% vendas" ou "economia de ~15h/semana")
- Concluir com: "Isso resolveria seu caso hoje?"

4. Lidar com objeções
- "É caro" → "Uma venda já paga 2 anos de assinatura. Quer testar 7 dias grátis e comprovar?"
- "Já uso X" → "Nosso diferencial é que a IA é nativa, não integração. Qual problema sua ferramenta atual não resolve bem?"
- "Sem tempo" → "O setup leva só 15min e nosso time acompanha você. Qual dia é melhor para uma demo rápida?"
- "Vou pensar" → "Compreendo. Qual ponto você gostaria de esclarecer antes de decidir?"

5. Direcionar para WhatsApp (quando lead quente)
Gatilhos: perguntou preço/demo, demonstrou interesse claro, pediu falar com alguém.
Mensagem padrão:
> "Podemos continuar no WhatsApp? Assim falo com você diretamente agora 👉 https://wa.me/5573981675332"

---

🚫 NUNCA
- Listar todos os recursos de uma vez sem contexto
- Responder sem follow-up
- Ser genérico, robótico ou insistente

✅ SEMPRE
- Entender o problema antes de oferecer solução
- Encerrar cada resposta com uma única pergunta
- Ser consultivo, humano e direto
- Usar frases curtas + emojis estratégicos (máx 2 por mensagem)

---

📝 EXEMPLO DE BOA RESPOSTA

"Entendo! Gerenciar mais de 100 imóveis manualmente deve ser um grande desafio.
Nosso CRM com cadastro por voz e contratos automáticos reduz muito o tempo gasto e ainda organiza leads e visitas.

Gostaria de economizar tempo ou aumentar suas vendas primeiro?"

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
