import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId } = await req.json();
    
    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: 'Property ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Buscando imóvel público:', propertyId);

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch property
    const { data: property, error: propertyError } = await supabase
      .from('imoveis')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('❌ Erro ao buscar imóvel:', propertyError);
      return new Response(
        JSON.stringify({ error: 'Property not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch property images
    const { data: images, error: imagesError } = await supabase
      .from('imovel_images')
      .select('*')
      .eq('imovel_id', propertyId)
      .order('display_order', { ascending: true });

    if (imagesError) {
      console.warn('⚠️ Erro ao buscar imagens:', imagesError);
    }

    // Fetch broker info
    const { data: broker, error: brokerError } = await supabase
      .from('conectaios_brokers')
      .select('id, name, username, bio, avatar_url, cover_url, status, phone, email, whatsapp, creci')
      .eq('user_id', property.owner_id)
      .single();

    if (brokerError) {
      console.warn('⚠️ Erro ao buscar corretor:', brokerError);
    }

    console.log('✅ Imóvel encontrado:', property.title);

    return new Response(
      JSON.stringify({
        property,
        images: images || [],
        broker: broker || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
