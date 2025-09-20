// VrSync Import Function - INTEGRATIONS_SAFE_MODE set to false (real imports enabled)
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
  reference_code: string;
  external_id: string;
  source_portal: string;
  titulo: string;
  listing_type: string;
  property_type: string;
  valor: number;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  descricao?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  fotos?: string[];
  raw_vrsync?: any;
  imported_at: string;
  is_public?: boolean;
  visibility?: string;
  user_id?: string | null;
  site_id?: string | null;
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
    const ownerParam = url.searchParams.get('owner');
    const siteIdParam = url.searchParams.get('siteId');
    const publishParam = url.searchParams.get('publish');
    
    // Validate owner UUID if provided
    if (ownerParam && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ownerParam)) {
      return new Response(JSON.stringify({
        error: 'Invalid owner parameter: must be a UUID',
        fetched_count: 0,
        created_count: 0,
        updated_count: 0,
        ignored_count: 0,
        errors: ['Invalid owner parameter: must be a UUID'],
        dryRun: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let feedUrl = '';
    
    // Get URL from query param or request body
    if (urlParam) {
      feedUrl = urlParam;
    } else if (req.method === 'POST') {
      const body = await req.json();
      feedUrl = body.url;
    }
    
    if (!feedUrl) {
      throw new Error('URL parameter is required');
    }

    console.log(`🚀 Starting VrSync import from: ${feedUrl}`);
    console.log(`📋 Dry run mode: ${dryRun}`);
    console.log(`🔍 Debug mode: ${debug}`);
    console.log(`👤 Owner: ${ownerParam || 'none'}`);
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
      removeNSPrefix: true, // Important for VrSync (OLX)
    });
    const xml = parser.parse(text);
    
    // VrSync discovery - specific path for <Listings><Listing>
    let items = xml?.ListingDataFeed?.Listings?.Listing
              ?? xml?.Listings?.Listing
              ?? [];

    if (!Array.isArray(items) && items) items = [items];
    
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
        errors:[], 
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
        
        // Extract VrSync data with enhanced parsing and logging
        const p = imovel;
        
        // Map reference_code for VrSync
        const reference_code = p?.ListingID?.toString()?.trim() || null;
        
        // Also extract external_id for metadata  
        const externalId = p?.ListingID ?? p?.ID ?? p?.id ?? p?.ExternalId ?? null;
        
        console.log(`🔍 Processing VrSync property ${i + 1}: ID candidates:`, {
          ListingID: p?.ListingID,
          ID: p?.ID,
          id: p?.id,
          ExternalId: p?.ExternalId,
          reference_code,
          finalId: externalId
        });
        
        if (!reference_code) {
          console.log(`❌ Skipping property ${i + 1}: Missing reference_code`);
          result.errors.push(`Property ${i + 1}: Missing required reference_code (tried: ListingID)`);
          result.ignored_count++;
          continue;
        }

        // Enhanced title extraction
        const titulo = p?.Title ?? p?.Name ?? p?.Description?.substring(0, 100) ?? `Imóvel ${externalId}`;
        
        // Enhanced price extraction with multiple fallbacks
        const priceFields = [
          p?.PricingInfos?.Price,
          p?.PricingInfos?.RentalTotalPrice,
          p?.Price,
          p?.SalePrice,
          p?.RentPrice,
          p?.Value,
          p?.Valor
        ];
        
        let valor = 0;
        let rawPrice = null;
        
        for (const priceField of priceFields) {
          if (priceField !== null && priceField !== undefined) {
            rawPrice = priceField;
            valor = Number(String(priceField).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            if (valor > 0) break;
          }
        }
        
        // Enhanced area extraction
        const areaFields = [p?.Area, p?.LivingArea, p?.TotalArea, p?.UsableArea, p?.BuiltArea];
        let area = 0;
        let rawArea = null;
        
        for (const areaField of areaFields) {
          if (areaField !== null && areaField !== undefined) {
            rawArea = areaField;
            area = parseFloat(areaField.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            if (area > 0) break;
          }
        }
        
        // Enhanced photos extraction
        const fotos = extractVrSyncPhotos(imovel);
        
        // Enhanced address extraction
        const endereco = p?.Address?.Street ?? 
                        p?.Location?.Address ?? 
                        p?.Street ?? 
                        p?.Endereco ?? '';
        
        console.log(`📋 Extracted VrSync data for ${reference_code}:`, {
          titulo,
          valor: `${rawPrice} → ${valor}`,
          area: `${rawArea} → ${area}`,
          endereco,
          fotos_count: fotos.length,
          bedrooms: p?.Bedrooms ?? p?.Details?.Bedrooms,
          bathrooms: p?.Bathrooms ?? p?.Details?.Bathrooms,
          parking: p?.ParkingSpaces ?? p?.Details?.Garage
        });

        // Map VrSync fields with enhanced defaults
        const propertyData: PropertyData = {
          reference_code,
          external_id: reference_code, // Same as reference_code for VrSync
          source_portal: 'vrsync',
          titulo,
          listing_type: mapListingType(p?.ListingType ?? p?.TransactionType ?? p?.Type),
          property_type: mapPropertyType(p?.PropertyType ?? p?.Details?.PropertyType ?? p?.Type),
          valor,
          area,
          quartos: parseInt(p?.Bedrooms?.toString() ?? p?.Details?.Bedrooms?.toString() ?? '0') || 0,
          banheiros: parseInt(p?.Bathrooms?.toString() ?? p?.Details?.Bathrooms?.toString() ?? '0') || 0,
          vagas: parseInt(p?.ParkingSpaces?.toString() ?? p?.Details?.Garage?.toString() ?? p?.Details?.ParkingSpaces?.toString() ?? '0') || 0,
          descricao: p?.Description ?? p?.Details?.Description ?? '',
          endereco,
          bairro: p?.Address?.Neighborhood ?? p?.Location?.Neighborhood ?? p?.Bairro ?? '',
          cidade: p?.Address?.City ?? p?.Location?.City ?? p?.Cidade ?? '',
          fotos,
          raw_vrsync: xmlToObject(imovel),
          imported_at: new Date().toISOString(),
          is_public: publishOnImport,
          visibility: publishOnImport ? 'public_site' : 'hidden',
          // New fields for broker assignment
          user_id: ownerParam || null,
          site_id: siteIdParam || null
        };

        // More lenient validation - accept if has title OR reasonable value
        const hasTitle = titulo && titulo.trim().length > 2 && !titulo.toLowerCase().includes('undefined');
        const hasValue = valor > 0;
        
        if (!hasTitle && !hasValue) {
          console.log(`⚠️ Skipping VrSync ${reference_code}: No valid title (${titulo}) or value (${valor})`);
          result.errors.push(`Property ${reference_code}: Missing essential data - titulo: "${titulo}", valor: ${valor}`);
          result.ignored_count++;
          continue;
        }
        
        // Accept partial data with warning
        if (!hasTitle || !hasValue) {
          console.log(`⚠️ Accepting VrSync ${reference_code} with partial data - titulo: ${hasTitle}, valor: ${hasValue}`);
        }

        if (result.dryRun) {
          console.log(`🧪 [DRY RUN] Would process: ${propertyData.titulo} - R$ ${propertyData.valor}`);
          result.created_count++; // Count as would-be-created for dry run
          continue;
        }

        // Upsert property using reference_code as conflict key
        const { data, error } = await supabase
          .from('properties')
          .upsert(propertyData, {
            onConflict: 'reference_code',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error('❌ Upsert error:', error);
          result.errors.push(`Property ${reference_code}: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          console.log(`✅ Processed: ${propertyData.titulo} (${reference_code})`);
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
      conflict_key: 'reference_code',
      owner: ownerParam || null,
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

// Helper functions for VrSync parsing
function getElementValue(obj: any, tagNames: string[]): string | undefined {
  for (const tagName of tagNames) {
    if (obj[tagName] !== undefined && obj[tagName] !== null) {
      return obj[tagName].toString().trim();
    }
    
    // Try case insensitive
    const lowerTag = tagName.toLowerCase();
    for (const key in obj) {
      if (key.toLowerCase() === lowerTag) {
        return obj[key]?.toString()?.trim();
      }
    }
  }
  return undefined;
}

function mapListingType(tipo: string | undefined): string {
  if (!tipo) return 'venda';
  const t = tipo.toLowerCase();
  if (t.includes('alug') || t.includes('rent') || t.includes('locacao')) return 'aluguel';
  if (t.includes('vend') || t.includes('sale') || t.includes('venda')) return 'venda';
  return 'venda';
}

function mapPropertyType(tipo: string | undefined): string {
  if (!tipo) return 'apartamento';
  const t = tipo.toLowerCase();
  if (t.includes('apto') || t.includes('apart')) return 'apartamento';
  if (t.includes('casa') || t.includes('house') || t.includes('residencial')) return 'casa';
  if (t.includes('terreno') || t.includes('land') || t.includes('lote')) return 'terreno';
  if (t.includes('sala') || t.includes('commercial') || t.includes('comercial')) return 'comercial';
  return 'apartamento';
}

function extractVrSyncPhotos(imovel: any): string[] {
  const photos: string[] = [];
  
  // Comprehensive photo extraction for VrSync format
  const photoSources = [
    // Standard VrSync paths
    imovel?.Medias?.Media,
    imovel?.Media,
    imovel?.Photos?.Photo,
    imovel?.Images?.Image,
    
    // Alternative paths
    imovel?.Fotos?.Foto,
    imovel?.fotos?.foto,
    imovel?.Photos,
    imovel?.Imagens?.Imagem,
    imovel?.imagens?.imagem,
    imovel?.Gallery?.Item,
    imovel?.Midias?.Midia
  ];
  
  for (const source of photoSources) {
    if (source) {
      const items = Array.isArray(source) ? source : [source];
      
      for (const item of items) {
        // Try multiple URL extraction patterns
        let url = null;
        
        if (typeof item === 'string') {
          url = item;
        } else if (item && typeof item === 'object') {
          url = item.Url ?? 
               item.URL ?? 
               item.url ?? 
               item.src ?? 
               item.href ?? 
               item.link ?? 
               item.Item?.URL ?? 
               item.Item?.Url ??
               item.arquivo;
        }
        
        if (url && typeof url === 'string') {
          const cleanUrl = url.trim();
          if (cleanUrl.startsWith('http') && !photos.includes(cleanUrl)) {
            photos.push(cleanUrl);
          }
        }
      }
      
      if (photos.length > 0) break; // Stop at first successful source
    }
  }
  
  return photos;
}

function xmlToObject(obj: any): any {
  // Simple object conversion for raw storage
  return obj;
}