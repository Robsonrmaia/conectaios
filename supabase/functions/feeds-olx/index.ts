import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

const FEEDS_AUTH_TOKEN = Deno.env.get('FEEDS_AUTH_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token from URL query parameter
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    // Validate token
    if (!token || token !== FEEDS_AUTH_TOKEN) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    console.log('OLX Feed Request - Token validated successfully');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Verificar se é feed individual de um corretor
    const brokerId = url.searchParams.get('broker_id');

    let properties = [];
    
    if (brokerId) {
      // XML individual para um corretor específico
      console.log(`Generating OLX feed for broker: ${brokerId}`);
      
      // Obter limite do plano do corretor
      const { data: limitData, error: limitError } = await supabase
        .rpc('get_broker_olx_limit', { p_broker_id: brokerId });
      
      const brokerLimit = limitData || 0;
      console.log(`Broker OLX limit: ${brokerLimit}`);
      
      if (brokerLimit === 0) {
        console.log('Broker has no OLX access');
        return new Response('<?xml version="1.0" encoding="UTF-8"?><olx_export><ads></ads></olx_export>', {
          headers: corsHeaders,
        });
      }
      
      // Buscar imóveis habilitados para OLX, respeitando o limite do plano
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('owner_id', brokerId)
        .eq('olx_enabled', true)
        .eq('is_public', true)
        .order('olx_published_at', { ascending: true, nullsFirst: true })
        .limit(brokerLimit);
      
      if (error) {
        console.error('OLX Feed Error (broker):', error);
        return new Response('Internal Server Error', { 
          status: 500,
          headers: corsHeaders 
        });
      }
      
      properties = data || [];
      
      // Atualizar timestamp de publicação
      if (properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        await supabase
          .from('imoveis')
          .update({ olx_published_at: new Date().toISOString() })
          .in('id', propertyIds);
      }
    } else {
      // XML global - todos os imóveis habilitados para OLX de todos os corretores
      console.log('Generating global OLX feed');
      
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('olx_enabled', true)
        .eq('is_public', true)
        .order('olx_published_at', { ascending: true, nullsFirst: true });
      
      if (error) {
        console.error('OLX Feed Error (global):', error);
        return new Response('Internal Server Error', { 
          status: 500,
          headers: corsHeaders 
        });
      }
      
      properties = data || [];
      
      // Atualizar timestamp de publicação
      if (properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        await supabase
          .from('imoveis')
          .update({ olx_published_at: new Date().toISOString() })
          .in('id', propertyIds);
      }
    }

    console.log(`Generating XML for ${properties.length} properties`);

    // Generate OLX XML format
    const xmlContent = generateOLXXML(properties);

    return new Response(xmlContent, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('OLX Feed Error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

function generateOLXXML(properties: any[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<olx_export>
  <publisher>
    <name>ConectaIOS</name>
    <email>contato@conectaios.com.br</email>
    <phone>11999999999</phone>
    <website>https://conectaios.com.br</website>
  </publisher>
  <ads>`;

  const xmlFooter = `  </ads>
</olx_export>`;

  const xmlListings = properties.map(property => {
    const images = Array.isArray(property.galeria_urls) ? property.galeria_urls : [];
    const imageElements = images.slice(0, 20).map((url: string) => 
      `      <image>${url}</image>`
    ).join('\n');

    return `    <ad>
      <id>${property.id}</id>
      <title><![CDATA[${property.titulo || ''}]]></title>
      <description><![CDATA[${property.descricao || ''}]]></description>
      <category>1020</category>
      <type>${property.finalidade === 'venda' ? 'sell' : 'rent'}</type>
      <price>${property.preco || 0}</price>
      <property_type>${mapOLXPropertyType(property.tipo)}</property_type>
      <rooms>${property.quartos || 0}</rooms>
      <bathrooms>${property.banheiros || 0}</bathrooms>
      <parking_spaces>${property.vagas || 0}</parking_spaces>
      <size>${property.metragem || 0}</size>
      <state>SP</state>
      <city>${property.cidade || ''}</city>
      <region>${property.bairro || ''}</region>
      <address>${property.endereco || ''}</address>
      <zipcode></zipcode>
      <images>
${imageElements}
      </images>
      <contact>
        <name>ConectaIOS</name>
        <email>contato@conectaios.com.br</email>
        <phone>11999999999</phone>
      </contact>
      <url>https://conectaios.com.br/imovel/${property.slug}</url>
    </ad>`;
  }).join('\n');

  return xmlHeader + '\n' + xmlListings + '\n' + xmlFooter;
}

function mapOLXPropertyType(tipo: string): string {
  const typeMap: { [key: string]: string } = {
    'apartamento': 'apartment',
    'casa': 'house',
    'sobrado': 'house',
    'cobertura': 'penthouse',
    'kitnet': 'studio',
    'loft': 'loft',
    'terreno': 'land',
    'comercial': 'commercial',
    'sala': 'commercial',
    'loja': 'commercial',
    'galpao': 'warehouse',
    'predio': 'building',
    'fazenda': 'farm',
    'sitio': 'farm',
    'chacara': 'farm'
  };
  
  return typeMap[tipo?.toLowerCase()] || 'apartment';
}