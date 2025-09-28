import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.conectaios.com.br, https://conectaios.com, http://localhost:5173',
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

    // Check Replicate token
    console.log('Checking Replicate API token...');
    const replicateToken = Deno.env.get('REPLICATE_API_KEY');
    
    console.log('Replicate token:', replicateToken ? `Found (${replicateToken.length} chars)` : 'Not found');

    if (!replicateToken) {
      console.error('Replicate API token not configured');
      return new Response(
        JSON.stringify({ error: 'Token do Replicate não configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Define staging prompts for image-to-image transformation  
    const stagingPrompts = {
      sala: {
        moderno: 'Transform this room into a modern living room while keeping the original architecture and room structure intact. Add contemporary furniture: sleek sofa, glass coffee table, modern lighting, but preserve all walls, windows, doors and room layout exactly as shown',
        classico: 'Transform this room into a classic living room while keeping the original architecture and room structure intact. Add traditional furniture: elegant sofa, wooden coffee table, classic decor, but preserve all walls, windows, doors and room layout exactly as shown',
        rustico: 'Transform this room into a rustic living room while keeping the original architecture and room structure intact. Add rustic furniture: wooden sofa, rustic coffee table, natural textures, but preserve all walls, windows, doors and room layout exactly as shown'
      },
      quarto: {
        moderno: 'Transform this room into a modern bedroom while keeping the original architecture and room structure intact. Add contemporary furniture: modern bed, sleek nightstands, minimal decor, but preserve all walls, windows, doors and room layout exactly as shown',
        classico: 'Transform this room into a classic bedroom while keeping the original architecture and room structure intact. Add traditional furniture: elegant bed, wooden nightstands, classic decor, but preserve all walls, windows, doors and room layout exactly as shown',
        rustico: 'Transform this room into a rustic bedroom while keeping the original architecture and room structure intact. Add rustic furniture: wooden bed, rustic nightstands, natural textures, but preserve all walls, windows, doors and room layout exactly as shown'
      },
      cozinha: {
        moderno: 'Transform this room into a modern kitchen while keeping the original architecture and room structure intact. Add contemporary elements: sleek cabinets, modern appliances, clean countertops, but preserve all walls, windows, doors and room layout exactly as shown',
        classico: 'Transform this room into a classic kitchen while keeping the original architecture and room structure intact. Add traditional elements: wooden cabinets, classic appliances, elegant countertops, but preserve all walls, windows, doors and room layout exactly as shown',
        rustico: 'Transform this room into a rustic kitchen while keeping the original architecture and room structure intact. Add rustic elements: wooden cabinets, traditional appliances, natural countertops, but preserve all walls, windows, doors and room layout exactly as shown'
      },
      escritorio: {
        moderno: 'Transform this room into a modern office while keeping the original architecture and room structure intact. Add contemporary furniture: modern desk, ergonomic chair, minimal decor, but preserve all walls, windows, doors and room layout exactly as shown',
        classico: 'Transform this room into a classic office while keeping the original architecture and room structure intact. Add traditional furniture: wooden desk, leather chair, classic decor, but preserve all walls, windows, doors and room layout exactly as shown',
        rustico: 'Transform this room into a rustic office while keeping the original architecture and room structure intact. Add rustic furniture: wooden desk, rustic chair, natural textures, but preserve all walls, windows, doors and room layout exactly as shown'
      }
    };

    const roomPrompts = stagingPrompts[roomType as keyof typeof stagingPrompts] || stagingPrompts.sala;
    const stagingPrompt = roomPrompts[style as keyof typeof roomPrompts] || roomPrompts.moderno;
    
    console.log('Using image-to-image with prompt:', stagingPrompt);
    console.log('Original image URL:', imageUrl);
    console.log('🚀 Using Replicate API for Virtual Staging');

    const startApiCall = Date.now();

    try {
      const replicate = new Replicate({ auth: replicateToken });
      
      // Use flux-dev for image-to-image transformation
      console.log('Using FLUX image-to-image with base image:', imageUrl);
      const replicateResult = await replicate.run(
        "black-forest-labs/flux-dev",
        {
          input: {
            image: imageUrl, // Base image for staging
            prompt: stagingPrompt,
            strength: 0.5, // Reduced strength to better preserve original structure
            guidance_scale: 4.0,
            num_outputs: 1,
            num_inference_steps: 28,
            output_format: "webp",
            output_quality: 95,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      );

      const apiCallTime = Date.now() - startApiCall;
      console.log(`✅ Replicate API call completed in ${apiCallTime}ms`);

      // Handle Replicate response
      let stagedImageUrl = '';
      if (Array.isArray(replicateResult) && replicateResult.length > 0) {
        stagedImageUrl = replicateResult[0];
      } else if (typeof replicateResult === 'string') {
        stagedImageUrl = replicateResult;
      }

      if (!stagedImageUrl) {
        throw new Error('Nenhuma imagem gerada pelo Replicate');
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Virtual staging completed successfully in ${totalTime}ms using Replicate`);

      return new Response(
        JSON.stringify({
          success: true,
          originalImage: imageUrl,
          stagedImage: stagedImageUrl,
          roomType,
          style,
          message: `Virtual staging aplicado com sucesso! Ambiente ${roomType} estilo ${style} criado.`,
          processingTime: totalTime,
          provider: 'Replicate'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (replicateError) {
      console.error('❌ Replicate API error:', replicateError);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao processar virtual staging com Replicate',
          details: replicateError.message,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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