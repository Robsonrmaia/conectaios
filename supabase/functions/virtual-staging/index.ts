import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request received');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Virtual Staging Function Started ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  try {
    const startTime = Date.now();
    console.log('Parsing request body...');
    
    const { imageUrl, roomType, style } = await req.json();
    console.log('Request params received:', { imageUrl: imageUrl ? 'provided' : 'missing', roomType, style });

    if (!imageUrl) {
      console.error('Missing imageUrl parameter');
      return new Response(
        JSON.stringify({ error: 'imageUrl é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Checking Hugging Face token...');
    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!hfToken) {
      console.error('HUGGING_FACE_ACCESS_TOKEN environment variable not found');
      return new Response(
        JSON.stringify({ error: 'Token do Hugging Face não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    console.log('Hugging Face token found, length:', hfToken.length);

    console.log('Initializing Hugging Face client...');
    const hf = new HfInference(hfToken);

    // Define simplified prompts for text-to-image generation
    const prompts = {
      sala: {
        moderno: 'modern living room interior, contemporary furniture, clean minimalist design, neutral colors, sofa, coffee table, natural lighting, high quality interior design photography',
        classico: 'classic traditional living room, warm wooden furniture, comfortable armchairs, classic decor, cozy atmosphere, elegant interior design',
        luxo: 'luxury living room, premium furniture, marble accents, high-end materials, sophisticated design, elegant lighting, expensive interior design'
      },
      quarto: {
        moderno: 'modern bedroom interior, minimalist platform bed, contemporary nightstands, clean aesthetics, neutral colors, modern lighting, high quality interior design',
        classico: 'classic bedroom, traditional wooden bed frame, vintage furniture, warm textiles, cozy atmosphere, timeless interior design',
        luxo: 'luxury bedroom, premium bedding, elegant furniture, sophisticated materials, high-end interior design, luxurious atmosphere'
      },
      cozinha: {
        moderno: 'modern kitchen interior, sleek cabinets, stainless steel appliances, quartz countertops, contemporary design, clean lines, modern kitchen design',
        classico: 'classic kitchen, traditional wooden cabinets, warm atmosphere, timeless design, classic appliances, cozy kitchen interior',
        luxo: 'luxury kitchen, premium cabinets, high-end appliances, marble countertops, designer fixtures, expensive kitchen interior'
      },
      escritorio: {
        moderno: 'modern office interior, contemporary desk, ergonomic chair, minimalist design, clean organization, modern workspace design',
        classico: 'classic office, traditional wooden desk, leather chair, warm atmosphere, timeless furniture, classic workspace',
        luxo: 'luxury office, executive desk, premium materials, sophisticated decor, high-end office furniture, elegant workspace'
      }
    };

    const roomPrompts = prompts[roomType as keyof typeof prompts] || prompts.sala;
    const prompt = roomPrompts[style as keyof typeof roomPrompts] || roomPrompts.moderno;
    
    const fullPrompt = `${prompt}, professional interior design photography, 8k resolution, high quality, well lit, realistic`;
    
    console.log('Generated prompt:', fullPrompt);
    console.log('Calling Hugging Face text-to-image API...');

    const startApiCall = Date.now();

    // Use a more reliable text-to-image model
    try {
      const result = await hf.textToImage({
        inputs: fullPrompt,
        model: 'runwayml/stable-diffusion-v1-5',
        parameters: {
          negative_prompt: 'blurry, low quality, distorted, messy, cluttered, dark, poorly lit, bad interior design',
          width: 512,
          height: 512,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        }
      });

      const apiCallTime = Date.now() - startApiCall;
      console.log(`Hugging Face API call completed in ${apiCallTime}ms`);

      console.log('Converting result to base64...');
      const arrayBuffer = await result.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const stagedImageUrl = `data:image/png;base64,${base64}`;

      const totalTime = Date.now() - startTime;
      console.log(`Virtual staging completed successfully in ${totalTime}ms`);

      const response = {
        success: true,
        originalImage: imageUrl,
        stagedImage: stagedImageUrl,
        roomType,
        style,
        message: `Virtual staging aplicado com sucesso! Ambiente ${roomType} estilo ${style} criado.`,
        processingTime: totalTime
      };

      console.log('Sending successful response');
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (hfError) {
      console.error('Hugging Face API error:', hfError);
      
      // Fallback: Create a mock staged image URL
      console.log('Creating fallback response...');
      const mockStagedUrl = imageUrl; // Use original as fallback for now
      
      return new Response(
        JSON.stringify({
          success: true,
          originalImage: imageUrl,
          stagedImage: mockStagedUrl,
          roomType,
          style,
          message: `Demonstração do virtual staging para ambiente ${roomType} estilo ${style}. (Modo demonstração)`,
          isDemo: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('=== Virtual Staging Function Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor ao processar virtual staging',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});