import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const PropertyIdSchema = z.object({
  propertyId: z.string().uuid('ID de propriedade inválido')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const body = await req.json();
    console.log('📥 Request body:', { hasPropertyId: !!body.propertyId });
    
    const { propertyId } = PropertyIdSchema.parse(body);
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

    if (propertyError || !property) {
      console.error('❌ Erro ao buscar imóvel:', propertyError);
      return new Response(
        JSON.stringify({ 
          error: 'Property not found',
          propertyId 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Imóvel encontrado:', property.title);

    // Fetch property images
    const { data: images, error: imagesError } = await supabase
      .from('imovel_images')
      .select('url')
      .eq('imovel_id', propertyId)
      .order('display_order', { ascending: true });

    if (imagesError) {
      console.warn('⚠️ Erro ao buscar imagens:', imagesError);
    } else {
      console.log('✅ Imagens encontradas:', images?.length || 0);
    }

    // Fetch broker info (excluding sensitive fields)
    const { data: broker, error: brokerError } = await supabase
      .from('conectaios_brokers')
      .select('id, name, username, bio, avatar_url, cover_url, status, creci')
      .eq('user_id', property.owner_id)
      .single();

    if (brokerError) {
      console.warn('⚠️ Erro ao buscar corretor:', brokerError);
    } else {
      console.log('✅ Corretor encontrado:', broker?.name);
    }

    // Map property data to expected format
    const mappedProperty = {
      id: property.id,
      titulo: property.title,
      valor: property.price,
      area: property.area_total,
      quartos: property.bedrooms,
      bathrooms: property.bathrooms,
      parking_spots: property.parking,
      listing_type: property.purpose,
      property_type: property.type,
      descricao: property.description,
      fotos: images?.map(img => img.url) || [],
      videos: [],
      address: property.address,
      neighborhood: property.neighborhood,
      city: property.city,
      state: property.state,
      zipcode: property.zipcode,
      reference_code: property.reference_code,
      created_at: property.created_at,
      user_id: property.owner_id,
      has_sea_view: property.vista_mar,
      furnishing_type: property.is_furnished ? 'furnished' : 'unfurnished',
      sea_distance: property.distancia_mar
    };

    console.log('📤 Retornando dados do imóvel');

    return new Response(
      JSON.stringify({
        property: mappedProperty,
        images: images || [],
        broker: broker || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação:', error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: error.errors 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log error details server-side only
    console.error('❌ Erro na função:', {
      message: error.message,
      stack: error.stack
    });

    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        error: 'An internal error occurred',
        requestId: crypto.randomUUID()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
