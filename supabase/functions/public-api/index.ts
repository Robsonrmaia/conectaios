import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PropertyResponse {
  id: string;
  titulo: string;
  property_type: string;
  listing_type: string;
  valor: number;
  quartos: number;
  area: number;
  neighborhood: string;
  city: string;
  state: string;
  fotos: string[];
  broker: {
    name: string;
    phone: string;
    email: string;
    username: string;
  };
}

interface BrokerResponse {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatar_url: string;
  phone: string;
  email: string;
  properties_count: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    console.log(`Public API request: ${req.method} ${pathname}`);

    // GET /properties - List public properties
    if (pathname === '/properties' && req.method === 'GET') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
      const propertyType = searchParams.get('property_type');
      const listingType = searchParams.get('listing_type');
      const city = searchParams.get('city');
      const minPrice = searchParams.get('min_price');
      const maxPrice = searchParams.get('max_price');
      const minBedrooms = searchParams.get('min_bedrooms');

      let query = supabase
        .from('properties')
        .select(`
          id,
          titulo,
          property_type,
          listing_type,
          valor,
          quartos,
          area,
          neighborhood,
          city,
          state,
          fotos,
          conectaios_brokers!properties_user_id_fkey (
            name,
            phone,
            email,
            username
          )
        `)
        .eq('is_public', true)
        .eq('visibility', 'public_site')
        .order('created_at', { ascending: false });

      // Apply filters
      if (propertyType) query = query.eq('property_type', propertyType);
      if (listingType) query = query.eq('listing_type', listingType);
      if (city) query = query.ilike('city', `%${city}%`);
      if (minPrice) query = query.gte('valor', parseFloat(minPrice));
      if (maxPrice) query = query.lte('valor', parseFloat(maxPrice));
      if (minBedrooms) query = query.gte('quartos', parseInt(minBedrooms));

      // Pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: properties, error, count } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }

      const formattedProperties: PropertyResponse[] = properties?.map(prop => ({
        id: prop.id,
        titulo: prop.titulo,
        property_type: prop.property_type,
        listing_type: prop.listing_type,
        valor: prop.valor,
        quartos: prop.quartos,
        area: prop.area,
        neighborhood: prop.neighborhood,
        city: prop.city,
        state: prop.state,
        fotos: prop.fotos || [],
        broker: {
          name: (prop.conectaios_brokers as any)?.name || '',
          phone: (prop.conectaios_brokers as any)?.phone || '',
          email: (prop.conectaios_brokers as any)?.email || '',
          username: (prop.conectaios_brokers as any)?.username || ''
        }
      })) || [];

      return new Response(JSON.stringify({
        success: true,
        data: formattedProperties,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /properties/:id - Get specific property
    if (pathname.startsWith('/properties/') && req.method === 'GET') {
      const propertyId = pathname.split('/')[2];

      const { data: property, error } = await supabase
        .from('properties')
        .select(`
          *,
          conectaios_brokers!properties_user_id_fkey (
            name,
            phone,
            email,
            username,
            bio,
            avatar_url
          )
        `)
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

      // Increment view count
      await supabase
        .from('properties')
        .update({
          views_count: (property.views_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      return new Response(JSON.stringify({
        success: true,
        data: {
          ...property,
          broker: property.conectaios_brokers
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /brokers - List active brokers
    if (pathname === '/brokers' && req.method === 'GET') {
      const { data: brokers, error } = await supabase
        .from('conectaios_brokers')
        .select(`
          id,
          name,
          username,
          bio,
          avatar_url,
          phone,
          email,
          properties:properties(count)
        `)
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching brokers:', error);
        throw error;
      }

      const formattedBrokers: BrokerResponse[] = brokers?.map(broker => ({
        id: broker.id,
        name: broker.name,
        username: broker.username,
        bio: broker.bio,
        avatar_url: broker.avatar_url,
        phone: broker.phone,
        email: broker.email,
        properties_count: broker.properties?.[0]?.count || 0
      })) || [];

      return new Response(JSON.stringify({
        success: true,
        data: formattedBrokers
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /brokers/:username - Get broker profile and properties
    if (pathname.startsWith('/brokers/') && req.method === 'GET') {
      const username = pathname.split('/')[2];

      const { data: broker, error: brokerError } = await supabase
        .from('conectaios_brokers')
        .select('*')
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
        .from('properties')
        .select('id, titulo, property_type, listing_type, valor, quartos, area, neighborhood, city, fotos')
        .eq('user_id', broker.user_id)
        .eq('is_public', true)
        .eq('visibility', 'public_site')
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching broker properties:', propertiesError);
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          broker,
          properties: properties || []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /leads - Capture lead information
    if (pathname === '/leads' && req.method === 'POST') {
      const body = await req.json();
      const { nome, telefone, email, interesse, property_id, broker_id } = body;

      if (!nome || !telefone || !interesse) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Nome, telefone e interesse são obrigatórios'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          nome,
          telefone,
          email,
          interesse,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        data: contact,
        message: 'Lead cadastrado com sucesso! Entraremos em contato em breve.'
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
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_public', true),
        supabase.from('conectaios_brokers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
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

    // Route not found
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint not found',
      available_endpoints: [
        'GET /properties',
        'GET /properties/:id',
        'GET /brokers',
        'GET /brokers/:username',
        'POST /leads',
        'GET /stats'
      ]
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in public-api function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});