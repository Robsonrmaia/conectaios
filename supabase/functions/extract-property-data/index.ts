import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { text } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Extracting property data from text:', text.substring(0, 200) + '...');

    const systemPrompt = `You are an expert extractor for Brazilian real-estate data. Return ONLY JSON strictly matching the schema provided. Do not invent data; return null if not found. Normalize Brazilian numbers (R$ 3.200,00 → 3200, 2/4 → 2 quartos). No text besides JSON.

Schema:
{
  "tipo": "string|null",
  "finalidade": "string|null", 
  "codigo": "string|null",
  "preco": "number|null",
  "area_m2": "number|null",
  "quartos": "number|null",
  "banheiros": "number|null",
  "vagas": "number|null",
  "cidade": "string|null",
  "uf": "string|null",
  "titulo": "string|null",
  "descricao": "string|null",
  "corretor": "string|null",
  "fonte": "screenshot"
}`;

    const userPrompt = `Extraia os dados do imóvel do texto OCR abaixo e devolva JSON no schema fornecido.
<<<
${text}
>>>`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('OpenAI Error details:', errorText);
      return new Response(
        JSON.stringify({ error: 'OpenAI API error', details: errorText }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid OpenAI response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let extractedData;
    try {
      extractedData = JSON.parse(data.choices[0].message.content);
      
      // Ensure 'fonte' is always 'screenshot'
      extractedData.fonte = 'screenshot';
      
      console.log('Successfully extracted data:', extractedData);
    } catch (parseError) {
      console.error('Failed to parse JSON from OpenAI:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse extracted data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ extractedData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in extract-property-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});