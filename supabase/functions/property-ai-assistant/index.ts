import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property, messages } = await req.json();
    
    console.log('🤖 Property AI Assistant - Nova mensagem');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }
    
    // Construir prompt do sistema com informações do imóvel
    const systemPrompt = `Você é um assistente virtual especializado em imóveis, representando este imóvel específico:

**Detalhes do Imóvel:**
- Título: ${property.titulo}
- Valor: R$ ${property.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Área: ${property.area}m²
- Quartos: ${property.quartos}
- Banheiros: ${property.bathrooms}
- Vagas de Garagem: ${property.parking_spots}
- Localização: ${property.neighborhood}, ${property.city}
- Tipo: ${property.property_type === 'apartamento' ? 'Apartamento' : property.property_type}
- Finalidade: ${property.listing_type === 'venda' ? 'Venda' : 'Locação'}
${property.descricao ? `- Descrição: ${property.descricao}` : ''}

**Sua Missão:**
1. Convencer o cliente sobre a **qualidade e localização privilegiada** deste imóvel
2. Responder perguntas de forma **clara, objetiva e persuasiva**
3. Destacar os **diferenciais e benefícios** do imóvel
4. Se o cliente demonstrar interesse, **incentivá-lo a agendar uma visita**
5. Ser sempre **profissional, amigável e prestativo**

**Diretrizes:**
- Use emojis de forma moderada para tornar a conversa mais agradável
- Seja breve e direto, evite respostas muito longas
- Se não souber algo específico, seja honesto mas destaque outras qualidades
- Sempre termine suas respostas incentivando o próximo passo (visita, contato, etc.)
- NUNCA invente informações que não foram fornecidas sobre o imóvel

**Exemplos de perguntas que você pode responder:**
- Sobre o bairro e localização
- Sobre as características do imóvel
- Sobre documentação e financiamento
- Sobre o processo de compra/locação
- Sobre os diferenciais do imóvel`;

    console.log('📤 Enviando requisição para Lovable AI...');
    
    // Chamar Lovable AI (gemini-2.5-flash)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            message: 'Desculpe, estamos com muitas solicitações no momento. Por favor, tente novamente em alguns segundos. 😊' 
          }), 
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            message: 'Desculpe, estamos com problemas técnicos no momento. Por favor, entre em contato diretamente conosco. 😊' 
          }), 
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    
    console.log('✅ Resposta recebida do AI');
    
    return new Response(
      JSON.stringify({ message: assistantMessage }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Desculpe, ocorreu um erro. Por favor, tente novamente ou entre em contato conosco diretamente. 😊' 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
