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
    console.log('Virtual staging function called');
    
    const { imageUrl, roomType, style } = await req.json();
    console.log('Request params:', { imageUrl, roomType, style });

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!hfToken) {
      console.error('HUGGING_FACE_ACCESS_TOKEN not found');
      return new Response(
        JSON.stringify({ error: 'Token do Hugging Face não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Initializing Hugging Face client');
    const hf = new HfInference(hfToken);

    // Define prompts based on room type and style
    const prompts = {
      sala: {
        moderno: 'modern living room with contemporary furniture, clean lines, neutral colors, elegant sofa, coffee table, wall art, natural lighting',
        classico: 'classic living room with traditional furniture, warm colors, comfortable armchairs, wooden coffee table, classic decor',
        luxo: 'luxury living room with high-end furniture, marble accents, premium materials, designer pieces, sophisticated lighting'
      },
      quarto: {
        moderno: 'modern bedroom with minimalist design, platform bed, contemporary nightstands, clean aesthetics, soft lighting',
        classico: 'classic bedroom with traditional bed frame, wooden furniture, warm textiles, classic decor elements',
        luxo: 'luxury bedroom with premium bedding, elegant furniture, sophisticated lighting, high-end materials'
      },
      cozinha: {
        moderno: 'modern kitchen with sleek cabinets, stainless steel appliances, quartz countertops, contemporary design',
        classico: 'classic kitchen with traditional cabinets, warm wood tones, classic appliances, timeless design',
        luxo: 'luxury kitchen with premium cabinets, high-end appliances, marble countertops, designer fixtures'
      },
      escritorio: {
        moderno: 'modern office with contemporary desk, ergonomic chair, clean organization, minimalist design',
        classico: 'classic office with traditional wooden desk, leather chair, warm atmosphere, timeless furniture',
        luxo: 'luxury office with executive desk, premium materials, sophisticated decor, high-end furnishings'
      }
    };

    const roomPrompts = prompts[roomType as keyof typeof prompts] || prompts.sala;
    const prompt = roomPrompts[style as keyof typeof roomPrompts] || roomPrompts.moderno;
    
    const fullPrompt = `Transform this empty room into a beautifully furnished ${prompt}, high quality interior design, professional photography, 8k resolution`;
    
    console.log('Using prompt:', fullPrompt);
    console.log('Fetching original image...');

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log('Image fetched, size:', imageBlob.size);

    console.log('Calling Hugging Face API...');

    // Use image-to-image model for virtual staging
    const result = await hf.imageToImage({
      inputs: imageBlob,
      parameters: {
        prompt: fullPrompt,
        negative_prompt: 'blurry, low quality, distorted, empty, unfurnished, messy, cluttered',
        num_inference_steps: 30,
        strength: 0.7,
        guidance_scale: 7.5,
      },
      model: 'stabilityai/stable-diffusion-xl-base-1.0'
    });

    console.log('Hugging Face API response received');

    // Convert the result to base64
    const arrayBuffer = await result.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const stagedImageUrl = `data:image/png;base64,${base64}`;

    console.log('Virtual staging completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        originalImage: imageUrl,
        stagedImage: stagedImageUrl,
        roomType,
        style,
        message: `Virtual staging aplicado com sucesso! Ambiente ${roomType} estilo ${style} criado.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in virtual-staging function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor ao processar virtual staging',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});