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
    const { prompt } = await req.json();

    if (!prompt) {
      console.log('No prompt provided');
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!hfToken) {
      console.log('No Hugging Face token found');
      return new Response(
        JSON.stringify({ error: 'Hugging Face token not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Token length:', hfToken.length);
    console.log('Using prompt:', prompt);

    const hf = new HfInference(hfToken);

    // Generate logo with specific prompt for professional look
    const logoPrompt = `professional business logo, ${prompt}, clean design, minimalist, high quality, transparent background, vector style, modern, real estate`;

    console.log('Generating logo with prompt:', logoPrompt);

    const image = await hf.textToImage({
      inputs: logoPrompt,
      model: 'black-forest-labs/FLUX.1-schnell',
    });

    console.log('Image generated successfully');

    // Convert the blob to a base64 string
    const arrayBuffer = await image.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Image converted to base64, length:', base64.length);

    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${base64}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating logo:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown stack');
    return new Response(
      JSON.stringify({ error: 'Failed to generate logo', details: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});