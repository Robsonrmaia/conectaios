import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

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

  console.log('=== Improved Virtual Staging Function Started ===');
  console.log('Request method:', req.method);

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

    // Check Replicate token
    console.log('Checking Replicate API token...');
    const replicateToken = Deno.env.get('REPLICATE_API_KEY');
    
    if (!replicateToken) {
      console.error('Replicate API token not configured');
      return new Response(
        JSON.stringify({ error: 'Token do Replicate não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Enhanced staging prompts specifically for preserving structure
    const stagingPrompts = {
      sala: {
        moderno: 'Transform this empty room into a modern living room while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: contemporary gray sofa, glass coffee table, modern floor lamp, abstract wall art, but preserve the original room layout completely',
        classico: 'Transform this empty room into a classic living room while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: elegant leather sofa, wooden coffee table, table lamp, classic paintings, but preserve the original room layout completely',
        rustico: 'Transform this empty room into a rustic living room while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: wooden furniture, rustic coffee table, natural textures, but preserve the original room layout completely'
      },
      quarto: {
        moderno: 'Transform this empty room into a modern bedroom while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: modern bed with white bedding, sleek nightstands, minimal decor, but preserve the original room layout completely',
        classico: 'Transform this empty room into a classic bedroom while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: traditional wooden bed, classic nightstands, elegant decor, but preserve the original room layout completely',
        rustico: 'Transform this empty room into a rustic bedroom while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: rustic wooden bed, natural wood nightstands, cozy textures, but preserve the original room layout completely'
      },
      cozinha: {
        moderno: 'Transform this empty room into a modern kitchen while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: sleek white cabinets, stainless steel appliances, marble countertops, but preserve the original room layout completely',
        classico: 'Transform this empty room into a classic kitchen while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: wooden cabinets, traditional appliances, granite countertops, but preserve the original room layout completely',
        rustico: 'Transform this empty room into a rustic kitchen while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: wooden cabinets, farmhouse appliances, butcher block countertops, but preserve the original room layout completely'
      },
      escritorio: {
        moderno: 'Transform this empty room into a modern office while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: modern white desk, ergonomic chair, computer setup, but preserve the original room layout completely',
        classico: 'Transform this empty room into a classic office while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: wooden desk, leather chair, bookshelf, but preserve the original room layout completely',
        rustico: 'Transform this empty room into a rustic office while keeping EXACTLY the same room structure, walls, windows, doors, and architectural elements. Add only: reclaimed wood desk, vintage chair, rustic decor, but preserve the original room layout completely'
      }
    };

    const roomPrompts = stagingPrompts[roomType as keyof typeof stagingPrompts] || stagingPrompts.sala;
    const stagingPrompt = roomPrompts[style as keyof typeof roomPrompts] || roomPrompts.moderno;
    
    console.log('Using enhanced image-to-image with prompt:', stagingPrompt);
    console.log('🚀 Using Replicate API for Improved Virtual Staging');

    const startApiCall = Date.now();

    try {
      const replicate = new Replicate({ auth: replicateToken });
      
      // Use fooocus for better image-to-image control  
      console.log('Using Fooocus for improved virtual staging:', imageUrl);
      const replicateResult = await replicate.run(
        "konieshadow/fooocus-api",
        {
          input: {
            cn_img1: imageUrl, // Control net image
            prompt: stagingPrompt,
            cn_type1: "ImagePrompt", // Use as reference
            cn_weight1: 0.7, // Strong reference to original
            negative_prompt: "blurry, distorted, changed walls, different room shape, modified architecture, extra doors, missing windows, altered structure",
            image_number: 1,
            image_seed: Math.floor(Math.random() * 1000000),
            sharpness: 2.0,
            guidance_scale: 4.0,
            base_model_name: "realisticVisionV51_v51VAE.safetensors",
            refiner_model_name: "None",
            style_selections: ["Fooocus V2", "Fooocus Photograph", "Fooocus Enhance"]
          }
        }
      );

      const apiCallTime = Date.now() - startApiCall;
      console.log(`✅ Fooocus API call completed in ${apiCallTime}ms`);

      // Handle Fooocus response
      let stagedImageUrl = '';
      if (Array.isArray(replicateResult) && replicateResult.length > 0) {
        stagedImageUrl = replicateResult[0];
      } else if (typeof replicateResult === 'string') {
        stagedImageUrl = replicateResult;
      }

      if (!stagedImageUrl) {
        // Fallback to FLUX if Fooocus fails
        console.log('Fooocus failed, falling back to FLUX...');
        const fluxResult = await replicate.run(
          "black-forest-labs/flux-dev",
          {
            input: {
              image: imageUrl,
              prompt: stagingPrompt,
              strength: 0.4, // Lower strength to preserve more structure
              guidance_scale: 3.5,
              num_outputs: 1,
              num_inference_steps: 28,
              output_format: "webp",
              output_quality: 95,
              seed: Math.floor(Math.random() * 1000000)
            }
          }
        );

        if (Array.isArray(fluxResult) && fluxResult.length > 0) {
          stagedImageUrl = fluxResult[0];
        } else if (typeof fluxResult === 'string') {
          stagedImageUrl = fluxResult;
        }
      }

      if (!stagedImageUrl) {
        throw new Error('Nenhuma imagem gerada pelos modelos');
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Improved virtual staging completed successfully in ${totalTime}ms`);

      return new Response(
        JSON.stringify({
          success: true,
          originalImage: imageUrl,
          stagedImage: stagedImageUrl,
          roomType,
          style,
          message: `Virtual staging melhorado aplicado! Ambiente ${roomType} estilo ${style} com melhor preservação da estrutura original.`,
          processingTime: totalTime,
          provider: 'Fooocus + FLUX Fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (replicateError) {
      console.error('❌ Virtual staging error:', replicateError);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao processar virtual staging melhorado',
          details: replicateError instanceof Error ? replicateError.message : 'Replicate API error',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('=== Improved Virtual Staging Function Error ===');
    console.error('Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor ao processar virtual staging melhorado',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});