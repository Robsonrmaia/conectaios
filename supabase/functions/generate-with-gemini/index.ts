import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { prompt, type } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt é obrigatório" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Token do Google não configurado" }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Enhance prompts based on type
    let enhancedPrompt = prompt;
    if (type === 'logo') {
      enhancedPrompt = `Create a professional real estate company logo with: ${prompt}. Style: modern, clean, minimalist, flat design, vector style, corporate branding, professional look`;
    } else if (type === 'cover') {
      enhancedPrompt = `Create a real estate cover image with: ${prompt}. Style: professional photography, architectural, property showcase, bright and welcoming, high-end real estate marketing`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate an image: ${enhancedPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          candidateCount: 1,
          maxOutputTokens: 1024
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error:', errorText);
      throw new Error(`Google API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response:', data);

    // Note: Gemini 2.5 Nano primarily generates text, not images
    // This is a placeholder - in reality, you'd need to use a different service for image generation
    // or combine this with an image generation API
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Nenhuma resposta gerada');
    }

    const generatedText = data.candidates[0]?.content?.parts?.[0]?.text;
    
    return new Response(JSON.stringify({ 
      success: true,
      text: generatedText,
      note: "Gemini 2.5 Nano gera texto. Para imagens, use o botão Hugging Face."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-with-gemini function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});