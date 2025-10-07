import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateTokenRequest {
  broker_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { broker_id }: GenerateTokenRequest = await req.json();

    if (!broker_id) {
      console.error('Missing broker_id in request');
      return new Response(
        JSON.stringify({ error: 'broker_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Generating token for broker:', broker_id);

    // Generate unique token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .rpc('generate_submission_token');

    if (tokenError) {
      console.error('Error generating token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate token', details: tokenError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const token = tokenData as string;
    console.log('Generated token:', token);

    // Create submission record
    const { data: submission, error: submissionError } = await supabaseClient
      .from('property_submissions')
      .insert({
        submission_token: token,
        broker_id: broker_id,
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        property_data: {},
        marketing_consent: false,
        exclusivity_type: 'non_exclusive'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create submission', details: submissionError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Created submission:', submission.id);

    // Construir URL completa
    const origin = req.headers.get('origin') || 'https://conectaios.com.br';
    const publicUrl = `${origin}/formulario-imovel/${token}`;

    console.log('Generated public URL:', publicUrl);

    return new Response(
      JSON.stringify({ 
        token, 
        submission_id: submission.id,
        public_url: publicUrl
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-submission-token:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);