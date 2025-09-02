import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

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
    const { imageUrl, style = 'moderno', roomType = 'sala' } = await req.json();
    
    console.log('Virtual Staging request:', { imageUrl, style, roomType });

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'URL da imagem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

    // Prompts otimizados para cada tipo de ambiente e estilo
    const prompts = {
      moderno: {
        sala: 'modern living room with sleek furniture, minimalist sofa, glass coffee table, contemporary lighting, clean lines, neutral colors',
        quarto: 'modern bedroom with platform bed, floating nightstands, contemporary dresser, minimalist decor, soft lighting',
        cozinha: 'modern kitchen with island, stainless steel appliances, quartz countertops, pendant lighting, clean cabinet design',
        escritorio: 'modern office with ergonomic desk, contemporary chair, built-in shelving, tech setup, minimalist workspace'
      },
      classico: {
        sala: 'classic living room with traditional sofa, wooden coffee table, elegant armchairs, vintage rug, warm lighting',
        quarto: 'classic bedroom with wooden bed frame, traditional nightstands, elegant dresser, classic decor, warm ambiance',
        cozinha: 'classic kitchen with wooden cabinets, marble countertops, traditional fixtures, warm color palette',
        escritorio: 'classic office with wooden desk, leather chair, bookshelf, traditional decor, warm professional ambiance'
      },
      luxo: {
        sala: 'luxury living room with premium leather sofa, marble coffee table, designer chairs, crystal chandelier, high-end finishes',
        quarto: 'luxury bedroom with king size bed, premium bedding, elegant furniture, sophisticated lighting, high-end decor',
        cozinha: 'luxury kitchen with premium appliances, marble island, custom cabinetry, designer fixtures, elegant finishes',
        escritorio: 'luxury office with executive desk, premium leather chair, built-in wine bar, sophisticated decor, high-end materials'
      }
    };

    const selectedPrompt = prompts[style as keyof typeof prompts]?.[roomType as keyof typeof prompts.moderno] || prompts.moderno.sala;
    
    const fullPrompt = `Transform this empty room into a beautifully furnished space: ${selectedPrompt}. Professional interior design, high quality, realistic lighting, 4K resolution, architectural photography style.`;

    console.log('Generated prompt:', fullPrompt);

    // Fazer o fetch da imagem original
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Não foi possível carregar a imagem');
    }
    
    const imageBlob = await imageResponse.blob();

    // Usar img2img para virtual staging
    const stagedImage = await hf.imageToImage({
      inputs: imageBlob,
      parameters: {
        prompt: fullPrompt,
        negative_prompt: 'blurry, low quality, distorted, unrealistic, bad lighting, empty room, unfurnished',
        strength: 0.75, // Manter estrutura da sala mas adicionar móveis
        guidance_scale: 7.5,
        num_inference_steps: 20
      },
      model: 'stabilityai/stable-diffusion-xl-base-1.0'
    });

    // Converter para base64
    const arrayBuffer = await stagedImage.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const stagedImageUrl = `data:image/png;base64,${base64}`;

    console.log('Virtual staging completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        originalImage: imageUrl,
        stagedImage: stagedImageUrl,
        style,
        roomType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Virtual staging error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar virtual staging',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});