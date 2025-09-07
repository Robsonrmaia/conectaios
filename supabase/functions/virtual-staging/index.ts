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
        moderno: 'staged modern living room with contemporary furniture, clean minimalist design, neutral colors, stylish sofa, glass coffee table, modern decor, well-lit space',
        classico: 'staged classic living room with traditional furniture, warm wooden pieces, comfortable seating, elegant decor, cozy atmosphere',
        luxo: 'staged luxury living room with premium furniture, marble accents, high-end materials, sophisticated design, elegant lighting'
      },
      quarto: {
        moderno: 'staged modern bedroom with minimalist platform bed, contemporary nightstands, clean aesthetics, neutral bedding, modern lighting',
        classico: 'staged classic bedroom with traditional wooden bed frame, vintage furniture, warm textiles, cozy atmosphere, timeless decor',
        luxo: 'staged luxury bedroom with premium bedding, elegant furniture, sophisticated materials, high-end decor, luxurious atmosphere'
      },
      cozinha: {
        moderno: 'staged modern kitchen with sleek cabinets, contemporary appliances, clean countertops, minimal decor, modern design',
        classico: 'staged classic kitchen with traditional wooden cabinets, warm atmosphere, timeless design, classic appliances, cozy feel',
        luxo: 'staged luxury kitchen with premium cabinets, high-end appliances, marble countertops, designer fixtures, expensive materials'
      },
      escritorio: {
        moderno: 'staged modern office with contemporary desk, ergonomic chair, minimal decor, clean organization, modern workspace',
        classico: 'staged classic office with traditional wooden desk, leather chair, warm atmosphere, timeless furniture, professional look',
        luxo: 'staged luxury office with executive desk, premium materials, sophisticated decor, high-end furniture, elegant workspace'
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
      
      // Use flux-dev for better image-to-image results
      const replicateResult = await replicate.run(
        "black-forest-labs/flux-dev",
        {
          input: {
            image: imageUrl, // Use the provided image as base
            prompt: stagingPrompt,
            strength: 0.6, // Keep some of original structure while adding furniture
            guidance_scale: 3.5,
            num_outputs: 1,
            num_inference_steps: 20,
            output_format: "webp",
            output_quality: 90,
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