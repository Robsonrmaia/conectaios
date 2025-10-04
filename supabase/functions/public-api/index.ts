import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

console.log("Public API Function Started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PropertyResponse {
  id: string;
  title: string;
  property_type?: string;
  purpose: string;
  price?: number;
  bedrooms?: number;
  area_total?: number;
  neighborhood?: string;
  city?: string;
  state?: string;
  cover_image?: string;
  broker: {
    name?: string;
    username?: string;
  };
}

interface BrokerResponse {
  id: string;
  name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  creci?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    console.log('Public API Request:', {
      method: req.method,
      pathname,
      params: Object.fromEntries(url.searchParams)
    });

    // GET /properties - List public properties with filters
    if (pathname === '/properties' && req.method === 'GET') {
      const cityFilter = url.searchParams.get('city');
      const purposeFilter = url.searchParams.get('purpose');
      const minPrice = url.searchParams.get('min_price');
      const maxPrice = url.searchParams.get('max_price');
      const bedrooms = url.searchParams.get('bedrooms');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabase
        .from('imoveis')
        .select(`
          id,
          title,
          property_type,
          purpose,
          price,
          bedrooms,
          area_total,
          neighborhood,
          city,
          state
        `)
        .eq('is_public', true)
        .eq('visibility', 'public_site')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (cityFilter) query = query.eq('city', cityFilter);
      if (purposeFilter) query = query.eq('purpose', purposeFilter);
      if (minPrice) query = query.gte('price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
      if (bedrooms) query = query.eq('bedrooms', parseInt(bedrooms));

      const { data: properties, error, count } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch properties'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get cover images for each property
      const propertiesWithImages = await Promise.all(
        (properties || []).map(async (property) => {
          const { data: images } = await supabase
            .from('imovel_images')
            .select('url')
            .eq('imovel_id', property.id)
            .eq('is_cover', true)
            .limit(1);

          // Get broker info
          const { data: broker } = await supabase
            .from('brokers')
            .select('name, username')
            .eq('user_id', property.owner_id)
            .single();

          return {
            ...property,
            cover_image: images?.[0]?.url || null,
            broker: {
              name: broker?.name,
              username: broker?.username
            }
          };
        })
      );

      return new Response(JSON.stringify({
        success: true,
        data: propertiesWithImages,
        pagination: {
          total: count || 0,
          limit,
          offset
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /properties/:id - Get single property details
    if (pathname.startsWith('/properties/') && req.method === 'GET') {
      const propertyId = pathname.split('/')[2];

      const { data: property, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', propertyId)
        .eq('is_public', true)
        .eq('visibility', 'public_site')
        .single();

      if (error || !property) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Property not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get images
      const { data: images } = await supabase
        .from('imovel_images')
        .select('url, position, is_cover')
        .eq('imovel_id', propertyId)
        .order('position');

      // Get broker info (ONLY public fields)
      const { data: broker } = await supabase
        .from('brokers')
        .select('name, username, bio, avatar_url, creci')
        .eq('user_id', property.owner_id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        data: {
          ...property,
          images: images || [],
          broker: broker || null
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /brokers - List active brokers
    if (pathname === '/brokers' && req.method === 'GET') {
      const { data: brokers, error } = await supabase
        .from('brokers')
        .select('id, name, username, bio, avatar_url, creci')
        .eq('status', 'active')
        .not('username', 'is', null)
        .order('name');

      if (error) {
        console.error('Error fetching brokers:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to fetch brokers'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: brokers
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /brokers/:username - Get broker profile and properties
    if (pathname.startsWith('/brokers/') && req.method === 'GET') {
      const username = pathname.split('/')[2];

      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .select('id, user_id, name, username, bio, avatar_url, creci')
        .eq('username', username)
        .eq('status', 'active')
        .single();

      if (brokerError || !broker) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Broker not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: properties, error: propertiesError } = await supabase
        .from('imoveis')
        .select('id, title, property_type, purpose, price, bedrooms, area_total, neighborhood, city')
        .eq('owner_id', broker.user_id)
        .eq('is_public', true)
        .eq('visibility', 'public_site')
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching broker properties:', propertiesError);
      }

      // Get cover images
      const propertiesWithImages = await Promise.all(
        (properties || []).map(async (property) => {
          const { data: images } = await supabase
            .from('imovel_images')
            .select('url')
            .eq('imovel_id', property.id)
            .eq('is_cover', true)
            .limit(1);

          return {
            ...property,
            cover_image: images?.[0]?.url || null
          };
        })
      );

      return new Response(JSON.stringify({
        success: true,
        data: {
          broker,
          properties: propertiesWithImages
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /leads - Capture lead information
    if (pathname === '/leads' && req.method === 'POST') {
      const body = await req.json();
      const { name, email, phone, message, property_id, broker_id } = body;

      if (!name || !email) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Name and email are required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('contacts')
        .insert({
          name,
          email,
          phone,
          message,
          broker_id,
          source: property_id ? `property_${property_id}` : 'public_api'
        });

      if (error) {
        console.error('Error creating lead:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to save lead'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Lead captured successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /stats - Public statistics
    if (pathname === '/stats' && req.method === 'GET') {
      const [
        { count: propertiesCount },
        { count: brokersCount },
        { count: leadsCount }
      ] = await Promise.all([
        supabase.from('imoveis').select('*', { count: 'exact', head: true }).eq('is_public', true).eq('visibility', 'public_site'),
        supabase.from('brokers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('contacts').select('*', { count: 'exact', head: true })
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          properties: propertiesCount || 0,
          brokers: brokersCount || 0,
          leads: leadsCount || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 404 for undefined endpoints
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
