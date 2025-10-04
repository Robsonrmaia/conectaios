// CNM Import Function - INTEGRATIONS_SAFE_MODE set to false (real imports enabled)
// Last updated to force redeploy after secret change
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportResult {
  fetched_count: number;
  created_count: number;
  updated_count: number;
  ignored_count: number;
  errors: string[];
  dryRun: boolean;
}

interface PropertyData {
  // Identificação
  owner_id: string | null;
  external_id: string;
  source: string;
  
  // Básico
  title: string;
  purpose: string;
  type: string;
  property_type?: string;
  listing_type?: string;
  description?: string;
  
  // Valores
  price: number;
  condo_fee?: number | null;
  iptu?: number | null;
  
  // Características
  is_furnished: boolean;
  
  // Áreas
  area_total?: number;
  area_built?: number;
  area_privativa?: number;
  
  // Cômodos
  bedrooms: number;
  bathrooms: number;
  suites?: number;
  parking?: number;
  
  // Localização
  address?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  
  // Outros
  construction_year?: number | null;
  
  // Visibilidade
  is_public: boolean;
  visibility: string;
  show_on_site: boolean;
  show_on_marketplace: boolean;
  show_on_minisite: boolean;
  
  // Status
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dryRun') === '1';
    const debug = url.searchParams.get('debug') === '1';
    const urlParam = url.searchParams.get('url');
    
    // New parameters for broker assignment  
    const userIdParam = url.searchParams.get('user_id');
    const siteIdParam = url.searchParams.get('siteId');
    const publishParam = url.searchParams.get('publish');
    
    // Validate user_id UUID if provided
    if (userIdParam && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userIdParam)) {
      return new Response(JSON.stringify({
        error: 'Invalid user_id parameter: must be a UUID',
        fetched_count: 0,
        created_count: 0,
        updated_count: 0,
        ignored_count: 0,
        errors: ['Invalid user_id parameter: must be a UUID'],
        dryRun: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let feedUrl = '';
    
    let userId = userIdParam;
    
    // Get URL and user_id from query param or request body
    if (urlParam) {
      feedUrl = urlParam;
    } else if (req.method === 'POST') {
      const body = await req.json();
      feedUrl = body.url;
      userId = userId || body.user_id;
    }
    
    if (!feedUrl) {
      throw new Error('URL parameter is required');
    }

    console.log(`🚀 Starting CNM import from: ${feedUrl}`);
    console.log(`📋 Dry run mode: ${dryRun}`);
    console.log(`🔍 Debug mode: ${debug}`);
    console.log(`👤 User ID: ${userId || 'none'}`);
    console.log(`🌐 Site ID: ${siteIdParam || 'none'}`);
    console.log(`📢 Publish override: ${publishParam || 'none'}`);

    // Fetch XML feed with proper headers
    console.log('📡 Fetching XML feed...');
    const res = await fetch(feedUrl, {
      method: 'GET',
      headers: { Accept: 'application/xml, text/xml, */*' },
      redirect: 'follow',
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    console.log(`📄 Fetched XML content: ${text.length} characters`);

    // Debug mode - return raw response info
    if (debug) {
      return new Response(JSON.stringify({
        status: res.status,
        contentType: res.headers.get('content-type'),
        size: text.length,
        head: text.slice(0, 500)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get configuration
    const publishOnImport = publishParam === '1' ? true : (publishParam === '0' ? false : Deno.env.get('PUBLISH_ON_IMPORT') === 'true');
    const safeMode = Deno.env.get('INTEGRATIONS_SAFE_MODE') === 'true';

    console.log(`⚙️ Publish on import: ${publishOnImport}`);
    console.log(`🛡️ Safe mode: ${safeMode}`);

    if (safeMode && !dryRun) {
      console.log('⚠️ Safe mode is enabled but not dry run - switching to dry run for safety');
    }

    const result: ImportResult = {
      fetched_count: 0,
      created_count: 0,
      updated_count: 0,
      ignored_count: 0,
      errors: [],
      dryRun: dryRun || safeMode
    };

    // Parse XML with namespace removal
    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      preserveOrder: false,
      removeNSPrefix: true, // Important for handling various namespaces
    });
    const xml = parser.parse(text);
    
    // CNM discovery - specific path with fallbacks
    let items =
      xml?.Document?.imoveis?.imovel ??
      xml?.imoveis?.imovel ??
      [];

    // se for objeto único, vira array
    if (!Array.isArray(items) && items) items = [items];

    // fallback: procurar por chaves 'imovel' em qualquer nível
    if (!items.length) {
      items = [];
      const stack = [xml];
      while (stack.length) {
        const n = stack.pop();
        if (n && typeof n === 'object') {
          for (const [k, v] of Object.entries(n)) {
            if (k.toLowerCase() === 'imovel') {
              if (Array.isArray(v)) items.push(...v);
              else items.push(v as any);
            } else if (v && typeof v === 'object') {
              stack.push(v as any);
            }
          }
        }
      }
    }
    
    const fetched_count = Array.isArray(items) ? items.length : 0;
    result.fetched_count = fetched_count;
    
    console.log(`🏠 Found ${fetched_count} properties to process`);
    
    // Early return for dry run before processing
    if (dryRun) {
      return new Response(JSON.stringify({ 
        fetched_count, 
        created_count: 0, 
        updated_count: 0, 
        ignored_count: fetched_count, 
        errors: [], 
        dryRun: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🏠 Found ${result.fetched_count} properties to process`);

    // Process each property
    for (let i = 0; i < items.length; i++) {
      try {
        const imovel = items[i];
        
        // Extract CNM data with detailed parsing and logging
        const it = imovel;
        
        // Map reference_code for CNM
        const reference_code = it.referencia?.toString()?.trim() || 
                              it.codigo_cliente?.toString()?.trim() || 
                              null;
        
        // Also extract external_id for metadata
        const externalId = it.referencia ?? it.codigo_cliente ?? it.codigo ?? it.id ?? it.ref ?? null;
        
        console.log(`🔍 Processing property ${i + 1}: ID candidates:`, {
          referencia: it.referencia,
          codigo_cliente: it.codigo_cliente,
          codigo: it.codigo,
          id: it.id,
          ref: it.ref,
          reference_code,
          finalId: externalId
        });
        
        if (!reference_code) {
          console.log(`❌ Skipping property ${i + 1}: Missing reference_code`);
          result.errors.push(`Property ${i + 1}: Missing required reference_code (tried: referencia, codigo_cliente)`);
          result.ignored_count++;
          continue;
        }

        // Enhanced title extraction with multiple fallbacks
        const titulo = it.titulo ?? it.nome ?? it.descricao_breve ?? it.tipo_imovel ?? it.tipo ?? `${it.tipo || 'Imóvel'} - ${externalId}`;
        
        // Enhanced value extraction with multiple patterns
        const rawValor = it.valor ?? it.preco ?? it.price ?? it.valor_venda ?? it.valor_locacao ?? '0';
        const valor = Number(rawValor.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        
        // Enhanced area extraction
        const rawArea = it.area ?? it.area_total ?? it.area_construida ?? it.metragem ?? it.metros ?? '0';
        const area = parseFloat(rawArea.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        
        // Enhanced address extraction
        const endereco = it.endereco?.toString()?.trim() ?? 
                        it.logradouro ?? 
                        it.rua ?? 
                        it.address ?? 
                        [it.rua, it.numero, it.complemento].filter(Boolean).join(', ') ?? '';
        
        // Enhanced photo extraction
        const fotos = extractPhotos(imovel);
        
        console.log(`📋 Extracted data for ${reference_code}:`, {
          titulo,
          valor: `${rawValor} → ${valor}`,
          area: `${rawArea} → ${area}`,
          endereco,
          fotos_count: fotos.length,
          quartos: it.quartos,
          banheiros: it.banheiros,
          vagas: it.vagas
        });

        // Map CNM data to our property structure
        const photos = extractPhotos(imovel);
        
        console.log(`💰 Property value extracted: ${valor} from raw: ${imovel.valor || imovel.preco}`);
        
        // Enhanced data extraction with proper mapping
        const quartos = parseInt(String(imovel.quartos || imovel.dormitorios || '0')) || 0;
        const banheiros = parseInt(String(imovel.banheiros || imovel.suites || '0')) || 0;
        const vagas = parseInt(String(imovel.vagas || imovel.garagem || '0')) || 0;
        const area_total = parseFloat(String(imovel.area_total || imovel.area || imovel.area_util || '0').replace(/[^\d.-]/g, '')) || 0;
        const area_privativa = parseFloat(String(imovel.area_privativa || imovel.area_util || '0').replace(/[^\d.-]/g, '')) || 0;
        const condominio = parseFloat(String(imovel.valor_condominio || imovel.condominio || '0').replace(/[^\d.-]/g, '')) || 0;
        const iptu_value = parseFloat(String(imovel.valor_iptu || imovel.iptu || '0').replace(/[^\d.-]/g, '')) || 0;
        const ano_construcao = parseInt(String(imovel.ano_construcao || imovel.ano || '0')) || null;
        const endereco_completo = imovel.endereco?.logradouro || imovel.logradouro || imovel.endereco || '';
        const bairro_name = imovel.endereco?.bairro || imovel.bairro || '';
        const cidade_name = imovel.endereco?.cidade || imovel.cidade || '';
        
        console.log(`🏗️ Enhanced data extraction for ${reference_code}:`, {
          quartos,
          banheiros,
          vagas,
          area_total,
          area_privativa,
          condominio,
          iptu_value,
          ano_construcao,
          endereco_completo,
          bairro_name,
          cidade_name
        });
        
        const propertyData: PropertyData = {
          // Obrigatórios
          owner_id: userId || null,
          title: String(imovel.titulo || `${mapPropertyType(imovel.tipo)} ${quartos ? `${quartos} quartos` : ''} ${mapListingType(imovel.transacao)} ${imovel.bairro || ''}`.trim()).substring(0, 255),
          purpose: mapListingType(imovel.transacao || imovel.finalidade),
          
          // Identificação/Origem
          external_id: reference_code,
          source: 'cnm',
          property_type: mapPropertyType(imovel.tipo),
          listing_type: mapListingType(imovel.transacao || imovel.finalidade),
          
          // Valores
          price: valor,
          condo_fee: condominio > 0 ? condominio : null,
          iptu: iptu_value > 0 ? iptu_value : null,
          
          // Características
          is_furnished: detectFurnishingType(imovel.descritivo || '') !== 'none',
          
          // Áreas
          area_total: area_total,
          area_built: area_privativa,
          area_privativa: area_privativa,
          
          // Cômodos
          bedrooms: quartos,
          bathrooms: banheiros,
          suites: parseInt(String(imovel.suites || '0')) || 0,
          parking: vagas,
          
          // Localização
          address: endereco_completo,
          street: imovel.endereco?.logradouro || imovel.logradouro || '',
          number: imovel.numero || '',
          neighborhood: bairro_name,
          city: cidade_name,
          state: imovel.estado || imovel.uf || '',
          zipcode: imovel.cep || '',
          latitude: parseFloat(imovel.latitude) || null,
          longitude: parseFloat(imovel.longitude) || null,
          
          // Outros
          description: imovel.descritivo || imovel.descricao || imovel.observacoes || '',
          construction_year: ano_construcao,
          
          // Visibilidade
          is_public: publishOnImport,
          visibility: publishOnImport ? 'public_site' : 'private',
          show_on_site: publishOnImport,
          show_on_marketplace: false,
          show_on_minisite: false,
          
          // Status
          status: 'available',
          type: mapPropertyType(imovel.tipo)
        };

        // More lenient validation - accept if has title OR reasonable value
        const hasTitle = titulo && titulo.trim().length > 2 && !titulo.toLowerCase().includes('undefined');
        const hasValue = valor > 0;
        
        if (!hasTitle && !hasValue) {
          console.log(`⚠️ Skipping ${reference_code}: No valid title (${titulo}) or value (${valor})`);
          result.errors.push(`Property ${reference_code}: Missing essential data - titulo: "${titulo}", valor: ${valor}`);
          result.ignored_count++;
          continue;
        }
        
        // Accept partial data with warning
        if (!hasTitle || !hasValue) {
          console.log(`⚠️ Accepting ${reference_code} with partial data - titulo: ${hasTitle}, valor: ${hasValue}`);
        }

        if (result.dryRun) {
          console.log(`🧪 [DRY RUN] Would process: ${propertyData.titulo} - R$ ${propertyData.valor}`);
          result.created_count++; // Count as would-be-created for dry run
          continue;
        }

        // Upsert property using owner_id and external_id unique index
        const { data, error } = await supabase
          .from('imoveis')
          .upsert(propertyData, {
            onConflict: 'owner_id,external_id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error('❌ Upsert error:', error);
          result.errors.push(`Property ${reference_code}: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          const propertyId = data[0].id;
          console.log(`✅ Property upserted: ${propertyData.title} (${reference_code})`);
          
          // Process photos separately into imovel_images table
          if (photos.length > 0) {
            console.log(`📸 Inserting ${photos.length} photos for property ${propertyId}`);
            
            const photoInserts = photos.map((url, index) => ({
              imovel_id: propertyId,
              url: url,
              position: index,
              is_cover: index === 0
            }));
            
            const { error: photoError } = await supabase
              .from('imovel_images')
              .upsert(photoInserts, { 
                onConflict: 'imovel_id,url',
                ignoreDuplicates: true 
              });
            
            if (photoError) {
              console.error('⚠️ Photo insert error:', photoError);
              result.errors.push(`Property ${reference_code} photos: ${photoError.message}`);
            } else {
              console.log(`✅ Inserted ${photos.length} photos`);
            }
          }
          
          result.created_count++;
        } else {
          result.updated_count++;
        }

      } catch (error) {
        console.error(`❌ Error processing property ${i + 1}:`, error);
        result.errors.push(`Property ${i + 1}: ${error.message}`);
      }
    }

    console.log('📊 Import completed:', result);

    return new Response(JSON.stringify({
      ...result,
      conflict_key: 'external_id',
      user_id: userId || null,
      siteId: siteIdParam || null,
      published: publishOnImport
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Import failed:', error);
    return new Response(JSON.stringify({
      error: error.message,
      fetched_count: 0,
      created_count: 0,
      updated_count: 0,
      ignored_count: 0,
      errors: [error.message],
      dryRun: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function detectFurnishingType(descricao: string): string {
  if (!descricao) return 'none';
  
  const desc = descricao.toLowerCase();
  
  // Check for furnished keywords
  if (desc.includes('mobiliado') || desc.includes('mobiliada') || desc.includes('furnished') ||
      desc.includes('completo') || desc.includes('equipado') || desc.includes('equipada')) {
    return 'furnished';
  }
  
  // Check for semi-furnished keywords  
  if (desc.includes('semi-mobiliado') || desc.includes('semi mobiliado') || 
      desc.includes('parcialmente mobiliado') || desc.includes('semi-furnished')) {
    return 'semi_furnished';
  }
  
  return 'none';
}

function mapListingType(tipo: string | undefined): string {
  if (!tipo) return 'sale';
  
  const normalized = tipo.toLowerCase().trim();
  
  // CNM specific mappings
  if (normalized.includes('alug') || normalized.includes('rent') || normalized === 'l' || 
      normalized === 're' || normalized.includes('loca')) {
    return 'rent';
  }
  
  if (normalized.includes('vend') || normalized.includes('sale') || normalized === 'v' ||
      normalized.includes('compra')) {
    return 'sale';
  }
  
  if (normalized.includes('temp') || normalized.includes('season')) {
    return 'season';
  }
  
  return 'sale'; // Default to sale
}

function mapPropertyType(tipo: string | undefined): string {
  if (!tipo) return 'apartment';
  
  const t = tipo.toLowerCase().trim();
  
  // Apartment
  if (t.includes('apto') || t.includes('apart')) {
    return 'apartment';
  }
  
  // House
  if (t.includes('casa') || t.includes('house')) {
    return 'house';
  }
  
  // Land/Terrain
  if (t.includes('terreno') || t.includes('land') || t.includes('lote')) {
    return 'land';
  }
  
  // Room
  if (t.includes('sala') || t.includes('quarto') || t.includes('room')) {
    return 'room';
  }
  
  // Commercial
  if (t.includes('comercial') || t.includes('commercial') || t.includes('loja') || t.includes('escritório')) {
    return 'commercial';
  }
  
  return 'apartment'; // Default to apartment
}

// Helper functions for path navigation
function getByPath(obj: any, path: string[]) {
  let cur = obj;
  for (const key of path) {
    if (!cur) return undefined;
    cur = cur[key] ?? cur[key.toLowerCase()] ?? cur[key.toUpperCase()];
  }
  return cur;
}

function deepFindArraysByKeys(obj: any, keys: string[]): any[] {
  const out: any[] = [];
  const stack = [obj];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    for (const [k, v] of Object.entries(node)) {
      if (keys.includes(k) || keys.includes(k.toLowerCase())) {
        if (Array.isArray(v)) out.push(...v);
        else out.push(v);
      }
      if (v && typeof v === 'object') stack.push(v);
    }
  }
  return out;
}

// Convert HTTP URLs to HTTPS using proxy
function toHttps(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://')) {
    const cleanUrl = url.replace(/^http:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
  }
  return url;
}

function extractPhotos(imovel: any): string[] {
  const photos: string[] = [];
  
  try {
    console.log('🖼️ Extracting photos from CNM item:', JSON.stringify(imovel, null, 2));
    
    // Try different possible paths for photos
    const fotoPaths = [
      imovel?.fotos_imovel?.foto,  // CNM specific path
      imovel?.fotos_imovel?.Foto,  // CNM with capital F
      imovel?.fotos?.foto,
      imovel?.Fotos?.Foto,
      imovel?.photos?.photo,
      imovel?.Photos?.Photo,
      imovel?.imagens?.imagem,
      imovel?.Imagens?.Imagem
    ];
    
    for (const fotoPath of fotoPaths) {
      if (fotoPath) {
        const fotoArray = Array.isArray(fotoPath) ? fotoPath : [fotoPath];
        console.log(`📷 Processing photo array with ${fotoArray.length} items`);
        
        for (const foto of fotoArray) {
          if (foto && typeof foto === 'object') {
            const url = foto.url || foto.URL || foto.src || foto.href;
            if (url && typeof url === 'string' && url.trim()) {
              const httpsUrl = toHttps(url.trim());
              photos.push(httpsUrl);
              console.log(`✅ Found photo URL: ${httpsUrl}`);
            }
          } else if (typeof foto === 'string' && foto.trim()) {
            const httpsUrl = toHttps(foto.trim());
            photos.push(httpsUrl);
            console.log(`✅ Found photo URL (string): ${httpsUrl}`);
          }
        }
      }
    }
    
    console.log(`🎯 Total photos extracted: ${photos.length}`);
  } catch (error) {
    console.error('❌ Error extracting photos:', error);
  }
  
  return [...new Set(photos)]; // Remove duplicates
}