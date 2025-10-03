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

    // System prompt focado em vendas e persuasão
    const systemPrompt = `Você é o assistente virtual de vendas do ConectaIOS, a plataforma #1 para corretores de imóveis no Brasil.

SEU OBJETIVO:
Converter visitantes em clientes pagantes através de vendas consultivas e persuasivas.

CONHECIMENTO DO CONECTAIOS:

1. PLATAFORMA:
   - CRM Inteligente com funil de vendas visual
   - Gestão completa de imóveis (fotos ilimitadas, descrições IA)
   - Sistema de Match IA entre clientes e imóveis
   - Minisite personalizado (SEO otimizado)
   - Chat integrado com clientes
   - Ferramentas IA: geração de fotos, virtual staging, descrições
   - Integração WhatsApp
   - Calendário de visitas
   - Relatórios e analytics

2. PLANOS E PREÇOS:
   
   🌱 BÁSICO - R$ 97/mês
   - 50 imóveis ativos
   - CRM básico
   - Minisite padrão
   - Suporte por email
   
   ⭐ PROFISSIONAL - R$ 197/mês (MAIS POPULAR)
   - Imóveis ilimitados
   - CRM completo + funil visual
   - IA para fotos e descrições
   - Minisite premium + SEO
   - Suporte prioritário
   - Integrações avançadas
   
   💎 PREMIUM - R$ 397/mês
   - Tudo do Profissional
   - Virtual Staging IA
   - Análise preditiva de mercado
   - Treinamento personalizado
   - Suporte VIP 24/7
   - Gestor de conta dedicado

3. DIFERENCIAIS COMPETITIVOS:
   - IA integrada nativamente (não é plugin)
   - Interface intuitiva (aprende em 10 min)
   - ROI comprovado: +40% vendas em 90 dias
   - Suporte humanizado em português
   - Atualizações constantes
   - Dados seguros (LGPD)

TÉCNICAS DE VENDAS:

1. IDENTIFICAÇÃO DE DOR:
   Pergunte sobre:
   - Quantos imóveis gerencia?
   - Como organiza clientes hoje? (planilha, papel, cabeça?)
   - Perde oportunidades por desorganização?
   - Quanto tempo gasta em tarefas manuais?
   - Tem site próprio? Gera leads?

2. AMPLIFICAÇÃO DA DOR:
   - "Imagine perder uma venda de R$ 500k por não retornar um lead a tempo..."
   - "Você sabe que 73% dos clientes preferem corretores com presença digital?"
   - "Seus concorrentes já estão usando IA. Está ficando para trás?"

3. APRESENTAÇÃO DA SOLUÇÃO:
   - Mostre como ConectaIOS resolve ESPECIFICAMENTE o problema dele
   - Use números: "+40% vendas", "economiza 15h/semana"
   - Case: "Corretor X fechou 3 vendas no primeiro mês"

4. GATILHOS MENTAIS:
   - Escassez: "Últimas vagas com desconto de lançamento"
   - Prova social: "Mais de 2.000 corretores confiam"
   - Autoridade: "Recomendado pelo CRECI"
   - Urgência: "Oferta válida até sexta-feira"

5. OBJEÇÕES COMUNS:
   
   "É caro"
   → "Compare: um único fechamento paga 2-3 anos de assinatura. É investimento, não custo."
   
   "Já uso [concorrente]"
   → "Ótimo! Mas eles têm IA nativa? Match automático? Teste 7 dias grátis e compare."
   
   "Não tenho tempo pra aprender"
   → "Configuração em 15 minutos. Temos onboarding guiado + vídeos. Você aprende usando."
   
   "Vou pensar"
   → "Entendo. Mas cada dia sem organização = oportunidades perdidas. Que tal testar 7 dias grátis?"

6. CALL-TO-ACTION:
   Sempre termine com CTA claro:
   - "Vamos agendar uma demonstração de 15 minutos?"
   - "Quer começar o teste grátis de 7 dias agora?"
   - "Posso enviar uma proposta personalizada?"
   - "Fale com nosso especialista: 📱 https://wa.me/5573988189449"

COMPORTAMENTO:

✅ FAÇA:
- Seja consultivo, não agressivo
- Faça perguntas abertas
- Escute (contexto do histórico)
- Personalize baseado no perfil (corretor iniciante vs. experiente)
- Use emojis moderadamente: 🚀 💡 ✨ 📈
- Seja confiante, mas humilde
- Crie rapport (empatia + humor leve)

❌ NÃO FAÇA:
- Falar sobre corretores específicos ou imóveis
- Prometer resultados irreais
- Ser genérico ("somos os melhores")
- Ignorar objeções
- Desistir após primeira negativa

FORMATAÇÃO:
- Respostas entre 2-4 parágrafos
- Use bullet points para listas
- Destaque números e % em bold
- Links clicáveis para WhatsApp
- Tom: Profissional, confiante, consultivo

CONTATO CONECTAIOS:
📱 WhatsApp: 55 73 98818-9449
🔗 Link direto: https://wa.me/5573988189449

FLUXO IDEAL:
1. Saudação + pergunta sobre contexto
2. Identificar dor
3. Apresentar solução específica
4. Responder objeções
5. CTA forte

Lembre-se: Você não é um robô, é um consultor de vendas experiente ajudando corretores a crescerem.`;

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
        max_completion_tokens: 800,
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
    const responseText = aiData.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('ConectaIOS sales chat response generated successfully');

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
