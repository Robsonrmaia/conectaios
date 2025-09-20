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

    // Get all public properties
    const { data: properties, error } = await supabase
      .from('v_public_properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('OLX Feed Error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Generate OLX XML format
    const xmlContent = generateOLXXML(properties || []);

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