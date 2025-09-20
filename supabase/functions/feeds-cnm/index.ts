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

    console.log('CNM Feed Request - Token validated successfully');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get all public properties
    const { data: properties, error } = await supabase
      .from('v_public_properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('CNM Feed Error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Generate CNM XML format
    const xmlContent = generateCNMXML(properties || []);

    return new Response(xmlContent, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('CNM Feed Error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

function generateCNMXML(properties: any[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync">
  <Header>
    <Provider>ConectaIOS</Provider>
    <Email>contato@conectaios.com.br</Email>
    <ContactName>ConectaIOS</ContactName>
    <Telephone>11999999999</Telephone>
    <PublishDate>${new Date().toISOString()}</PublishDate>
  </Header>
  <Listings>`;

  const xmlFooter = `  </Listings>
</ListingDataFeed>`;

  const xmlListings = properties.map(property => {
    const images = Array.isArray(property.galeria_urls) ? property.galeria_urls : [];
    const imageElements = images.map((url: string) => 
      `        <Media>
          <Item medium="image" caption="" primary="true">
            <URL>${url}</URL>
          </Item>
        </Media>`
    ).join('\n');

    return `    <Listing>
      <ListingID>${property.id}</ListingID>
      <Title><![CDATA[${property.titulo || ''}]]></Title>
      <TransactionType>${property.finalidade === 'venda' ? 'Sale' : 'Rent'}</TransactionType>
      <PropertyType>${mapPropertyType(property.tipo)}</PropertyType>
      <PublicationType>STANDARD</PublicationType>
      <DetailViewUrl>https://conectaios.com.br/imovel/${property.slug}</DetailViewUrl>
      <Price currency="BRL">${property.preco || 0}</Price>
      <Location displayAddress="Neighborhood">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="SP">São Paulo</State>
        <City>${property.cidade || ''}</City>
        <Zone>${property.bairro || ''}</Zone>
        <Address>${property.endereco || ''}</Address>
      </Location>
      <Details>
        <PropertyType>${mapPropertyType(property.tipo)}</PropertyType>
        <Description><![CDATA[${property.descricao || ''}]]></Description>
        <LivingArea unit="square metres">${property.metragem || 0}</LivingArea>
        <Bedrooms>${property.quartos || 0}</Bedrooms>
        <Bathrooms>${property.banheiros || 0}</Bathrooms>
        <Garage type="Parking Space">${property.vagas || 0}</Garage>
      </Details>
      <Media>
${imageElements}
      </Media>
      <ContactInfo>
        <Name>ConectaIOS</Name>
        <Email>contato@conectaios.com.br</Email>
        <Website>https://conectaios.com.br</Website>
        <Telephone>11999999999</Telephone>
      </ContactInfo>
    </Listing>`;
  }).join('\n');

  return xmlHeader + '\n' + xmlListings + '\n' + xmlFooter;
}

function mapPropertyType(tipo: string): string {
  const typeMap: { [key: string]: string } = {
    'apartamento': 'Apartment',
    'casa': 'House',
    'sobrado': 'House',
    'cobertura': 'Penthouse',
    'kitnet': 'Studio',
    'loft': 'Loft',
    'terreno': 'Land',
    'comercial': 'Commercial',
    'sala': 'Commercial',
    'loja': 'Commercial',
    'galpao': 'Warehouse',
    'predio': 'Building',
    'fazenda': 'Farm',
    'sitio': 'Farm',
    'chacara': 'Farm'
  };
  
  return typeMap[tipo?.toLowerCase()] || 'Apartment';
}