import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Get Hugging Face Token Function Started ===');
  console.log('Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request received');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking for HUGGING_FACE_ACCESS_TOKEN environment variable...');
    const token = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    
    if (!token) {
      console.error('HUGGING_FACE_ACCESS_TOKEN environment variable not found');
      console.log('Available environment variables:', Object.keys(Deno.env.toObject()));
      
      return new Response(
        JSON.stringify({ 
          error: 'Hugging Face token not configured',
          details: 'HUGGING_FACE_ACCESS_TOKEN environment variable is missing'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Token found, length:', token.length);
    console.log('Token starts with:', token.substring(0, 10) + '...');

    // Test the token by making a simple API call
    console.log('Testing token validity...');
    try {
      const testResponse = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Token test response status:', testResponse.status);
      
      if (testResponse.status === 401) {
        console.error('Token is invalid (401 Unauthorized)');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid Hugging Face token',
            details: 'The provided token is not valid or has expired'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

    } catch (testError) {
      console.error('Error testing token:', testError);
      // Continue anyway, the token might still work
    }

    console.log('Returning token to client');
    return new Response(
      JSON.stringify({ 
        token,
        tokenLength: token.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('=== Get Hugging Face Token Function Error ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown stack');
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});