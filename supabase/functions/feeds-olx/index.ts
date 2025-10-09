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
      console.log(`Generating VRSync feed for broker: ${brokerId}`);
      
      // Obter limite do plano do corretor
      const { data: limitData, error: limitError } = await supabase
        .rpc('get_broker_olx_limit', { p_broker_id: brokerId });
      
      const brokerLimit = limitData || 0;
      console.log(`Broker OLX limit: ${brokerLimit}`);
      
      if (brokerLimit === 0) {
        console.log('Broker has no OLX access');
        return new Response('<?xml version="1.0" encoding="UTF-8"?><ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"></ListingDataFeed>', {
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
        console.error('VRSync Feed Error (broker):', error);
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
      console.log('Generating global VRSync feed');
      
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('olx_enabled', true)
        .eq('is_public', true)
        .order('olx_published_at', { ascending: true, nullsFirst: true });
      
      if (error) {
        console.error('VRSync Feed Error (global):', error);
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

    console.log(`Generating VRSync XML for ${properties.length} properties`);

    // Generate VRSync XML format
    const xmlContent = generateVRSyncXML(properties);

    return new Response(xmlContent, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('VRSync Feed Error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

function generateVRSyncXML(properties: any[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync">`;

  const xmlFooter = `</ListingDataFeed>`;

  const xmlListings = properties
    .filter(property => {
      const olx = property.olx_data || {};
      // Validar TODOS os campos obrigatórios VRSync
      return (
        olx.state_abbr &&
        olx.city &&
        olx.neighborhood &&
        olx.address &&
        olx.street_number &&
        olx.postal_code &&
        olx.living_area > 0 &&
        olx.contact_name &&
        olx.contact_email &&
        olx.contact_phone
      );
    })
    .map(property => {
      const olx = property.olx_data || {};
      const images = Array.isArray(property.galeria_urls) ? property.galeria_urls : [];
      
      // Mapear TransactionType
      const transactionType = property.finalidade === 'venda' ? 'For Sale' : 
                              property.finalidade === 'aluguel' ? 'For Rent' : 
                              'Sale/Rent';
      
      // Mapear PropertyType VRSync
      const propertyType = mapVRSyncPropertyType(property.tipo);
      
      // Preço (inteiro, sem vírgulas)
      const price = Math.round(property.preco || 0);
      
      // Formatar CEP com hífen
      const postalCode = formatCEP(olx.postal_code);
      
      // Imagens (máximo 50, formato correto VRSync)
      const mediaItems = images.slice(0, 50).map((url: string, index: number) => 
        `    <Item medium="image" caption="Imagem ${index + 1}">
      <![CDATA[${url}]]>
    </Item>`
      ).join('\n');

      // Descrição completa (incluir observações)
      const fullDescription = (property.descricao || '') + 
        (olx.observations ? '\n\n' + olx.observations : '');

      return `  <Listing>
    <ListingID>${property.reference_code || property.id}</ListingID>
    <Title><![CDATA[${truncate(property.titulo, 100)}]]></Title>
    <TransactionType>${transactionType}</TransactionType>
    
    <Location displayAddress="${olx.display_address || 'Street'}">
      <Country abbreviation="BR">Brasil</Country>
      <State abbreviation="${olx.state_abbr}">${olx.state || getStateName(olx.state_abbr)}</State>
      <City>${olx.city}</City>
      <Neighborhood>${olx.neighborhood}</Neighborhood>
      <Address>${olx.address}</Address>
      <StreetNumber>${olx.street_number}</StreetNumber>${olx.complement ? `
      <Complement>${olx.complement}</Complement>` : ''}
      <PostalCode>${postalCode}</PostalCode>
    </Location>
    
    <Details>
      <PropertyType>${propertyType}</PropertyType>
      <Description><![CDATA[${truncate(fullDescription, 3000)}]]></Description>
      
      ${transactionType.includes('Sale') ? `<ListPrice currency="BRL">${price}</ListPrice>` : ''}
      ${transactionType.includes('Rent') ? `<RentalPrice currency="BRL" period="Monthly">${price}</RentalPrice>` : ''}
      
      <LivingArea unit="square metres">${olx.living_area}</LivingArea>${olx.lot_area ? `
      <LotArea unit="square metres">${olx.lot_area}</LotArea>` : ''}
      
      ${property.quartos ? `<Bedrooms>${property.quartos}</Bedrooms>` : ''}
      ${property.banheiros ? `<Bathrooms>${property.banheiros}</Bathrooms>` : ''}
      ${property.suites ? `<Suites>${property.suites}</Suites>` : ''}
      ${property.vagas ? `<Garage type="Parking Space">${property.vagas}</Garage>` : ''}
      
      ${property.vista_mar ? `<Features>
        <Feature>Ocean View</Feature>
      </Features>` : ''}
    </Details>
    
    <Media>
${mediaItems}
    </Media>
    
    <ContactInfo>
      <Name>${olx.contact_name}</Name>
      <Email>${olx.contact_email}</Email>
      <Telephone>${olx.contact_phone}</Telephone>
    </ContactInfo>
  </Listing>`;
    }).join('\n');

  return xmlHeader + '\n' + xmlListings + '\n' + xmlFooter;
}

// === HELPER FUNCTIONS ===

function mapVRSyncPropertyType(tipo: string): string {
  const typeMap: { [key: string]: string } = {
    'apartamento': 'Residential / Apartment',
    'casa': 'Residential / Home',
    'sobrado': 'Residential / Home',
    'cobertura': 'Residential / Penthouse',
    'kitnet': 'Residential / Studio',
    'loft': 'Residential / Loft',
    'terreno': 'Residential / Land/Lot',
    'comercial': 'Commercial / Building',
    'sala': 'Commercial / Office',
    'loja': 'Commercial / Store/Retail',
    'galpao': 'Commercial / Warehouse',
    'predio': 'Commercial / Building',
    'fazenda': 'Farm',
    'sitio': 'Farm',
    'chacara': 'Farm'
  };
  
  return typeMap[tipo?.toLowerCase()] || 'Residential / Apartment';
}

function getStateName(abbr: string): string {
  const states: { [key: string]: string } = {
    'BA': 'Bahia',
    'RJ': 'Rio de Janeiro',
    'SP': 'São Paulo',
    'MG': 'Minas Gerais'
  };
  return states[abbr] || abbr;
}

function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  return clean.length === 8 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : cep;
}

function truncate(str: string, max: number): string {
  return str && str.length > max ? str.slice(0, max - 3) + '...' : str;
}
